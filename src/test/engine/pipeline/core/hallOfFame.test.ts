import { describe, it, expect } from 'vitest';
import { processHallOfFame, recordWeeklyHallOfFame } from '@/engine/pipeline/core/hallOfFame';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState, Warrior } from '@/types/game';
import type { FightSummary } from '@/types/combat.types';
import type { TournamentId } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';

describe('processHallOfFame', () => {
  const mkW = (
    id: string,
    name: string,
    wins: number,
    kills: number,
    fame: number,
    stableId: string
  ): Warrior =>
    ({
      id,
      name,
      stableId,
      style: FightingStyle.StrikingAttack,
      fame,
      career: { wins, kills, losses: 0 },
      yearlySnapshots: {
        1: { wins: 0, kills: 0, losses: 0, fame: 0 }, // Snapshots for Year 1 representing start of year
      },
      status: 'Active',
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      awards: [],
    }) as any;

  const baseState: Partial<GameState> = {
    week: 1,
    year: 2, // Rolled over to Year 2
    awards: [],
    player: { id: 'p1', stableName: 'PlayerStable', fame: 0 } as any,
    fame: 0,
    roster: [],
    rivals: [],
    newsletter: [],
  };

  it('returns state unchanged if not week 1 of a new year', () => {
    const state = { ...baseState, week: 2 } as GameState;
    const impact = processHallOfFame(state, 2);
    const res = resolveImpacts(state, [impact]);
    expect(res).toEqual(state);
  });

  it('returns state unchanged if it is the very first week of the game (Year 1)', () => {
    const state = { ...baseState, year: 1 } as GameState;
    const impact = processHallOfFame(state, 1);
    const res = resolveImpacts(state, [impact]);
    expect(res).toEqual(state);
  });

  it('correctly calculates and applies annual awards on the transition tick (week 52 → 1)', () => {
    const state = {
      ...baseState,
      week: 52,
      year: 1,
      roster: [mkW('w1', 'Winner', 10, 0, 10, 'p1')],
      rivals: [
        {
          owner: { id: 'r1', stableName: 'RivalStable' },
          roster: [mkW('w2', 'Killer', 5, 5, 20, 'r1')],
          fame: 0,
        } as any,
      ],
    } as GameState;

    const impact = processHallOfFame(state, 1);

    const res = resolveImpacts(state, [impact]);

    expect(res.awards?.length).toBeGreaterThan(0);
    const awardTypes = res.awards?.map((a) => a.type);
    expect(awardTypes).toContain('WARRIOR_OF_YEAR');
    expect(awardTypes).toContain('KILLER_OF_YEAR');
  });

  it('skips HOF processing on a post-rollover tick (already handled on transition)', () => {
    const state = {
      ...baseState,
      week: 1,
      year: 2,
    } as GameState;

    const impact = processHallOfFame(state, 2);

    expect(impact).toEqual({});
  });
});

describe('recordWeeklyHallOfFame', () => {
  const mkFight = (
    id: string,
    opts: { by?: string; tournamentId?: string; fameDelta?: number } = {}
  ): FightSummary =>
    ({
      id,
      week: 7,
      absoluteWeek: 7,
      title: id,
      warriorIdA: 'a',
      warriorIdD: 'd',
      winner: 'A',
      by: opts.by ?? 'Decision',
      styleA: 'Brawler',
      styleD: 'Brawler',
      tournamentId: opts.tournamentId as TournamentId | undefined,
      fameDeltaA: opts.fameDelta ?? 0,
      fameDeltaD: opts.fameDelta ?? 0,
      createdAt: 'w7',
    }) as FightSummary;

  const weekState = (fights: FightSummary[]): GameState =>
    ({
      week: 7,
      year: 1,
      absoluteWeek: 7,
      arenaHistory: fights,
      hallOfFame: [],
    }) as unknown as GameState;

  it('records a Fight of the Week entry for the most notable bout', () => {
    const state = weekState([
      mkFight('f1', { fameDelta: 5 }),
      mkFight('f2', { by: 'Kill', fameDelta: 1 }),
      mkFight('f3', { fameDelta: 9 }),
    ]);

    const impact = recordWeeklyHallOfFame(state);

    expect(impact.hallOfFame).toHaveLength(1);
    expect(impact.hallOfFame?.[0]?.label).toBe('Fight of the Week');
    expect(impact.hallOfFame?.[0]?.fightId).toBe('f2'); // the kill outranks fame
  });

  it('records a Fight of the Tournament entry per tournament final', () => {
    const state = weekState([
      mkFight('qf', { tournamentId: 't-gold' }),
      mkFight('final', { tournamentId: 't-gold' }),
      mkFight('regular', {}),
    ]);

    const impact = recordWeeklyHallOfFame(state);

    expect(impact.hallOfFame).toHaveLength(2);
    const labels = impact.hallOfFame?.map((e) => e.label);
    expect(labels).toContain('Fight of the Tournament');
    expect(labels).toContain('Fight of the Week');
    const fot = impact.hallOfFame?.find((e) => e.label === 'Fight of the Tournament');
    expect(fot?.fightId).toBe('final'); // last tournament bout = the final
  });

  it('returns no impact on weeks with no fights', () => {
    expect(recordWeeklyHallOfFame(weekState([]))).toEqual({});
  });

  it('does not double-record fights already in the ledger', () => {
    const fight = mkFight('f1');
    const state = {
      ...weekState([fight]),
      hallOfFame: [
        { id: 'h1', week: 7, label: 'Fight of the Week' as const, fightId: 'f1' },
      ],
    } as unknown as GameState;

    expect(recordWeeklyHallOfFame(state)).toEqual({});
  });
});
