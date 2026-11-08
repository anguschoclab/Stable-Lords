import { describe, it, expect } from 'vitest';
import { processHallOfFame, recordWeeklyHallOfFame } from '@/engine/pipeline/core/hallOfFame';
import { resolveImpacts } from '@/engine/impacts';
import type { GameState, Warrior } from '@/types/game';
import type { RivalStableData } from '@/types/state.types';
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

  describe('stable + tournament annual awards', () => {
    const yearEndState = (roster: Warrior[], rivals: Partial<RivalStableData>[]): GameState =>
      ({
        ...baseState,
        week: 52,
        year: 1,
        roster,
        rivals,
      }) as unknown as GameState;

    it('awards STABLE_OF_YEAR to the stable with the most year-delta wins', () => {
      // p1 stable: 3+2=5 year wins; r1 stable: 6 year wins → r1 takes it
      const state = yearEndState(
        [
          mkW('w1', 'PA', 3, 0, 10, 'p1'),
          mkW('w2', 'PB', 2, 0, 10, 'p1'),
        ],
        [
          {
            id: 'r1',
            owner: { id: 'r1', stableName: 'RivalStable' },
            roster: [mkW('w3', 'RA', 6, 0, 10, 'r1')],
            fame: 100,
          } as any,
        ]
      );

      const res = resolveImpacts(state, [processHallOfFame(state, 1)]);
      const soty = res.awards?.find((a) => a.type === 'STABLE_OF_YEAR');
      expect(soty).toBeDefined();
      expect(soty?.stableId).toBe('r1');
      expect(soty?.stableName).toBe('RivalStable');
      expect(soty?.warriorId).toBeUndefined();
      expect(soty?.value).toBe(6);
    });

    it('bumps the winning rival stable fame; player win bumps player fame', () => {
      const rivalWin = yearEndState(
        [mkW('w1', 'PA', 3, 0, 10, 'p1')],
        [
          {
            id: 'r1',
            owner: { id: 'r1', stableName: 'RivalStable' },
            roster: [mkW('w3', 'RA', 6, 0, 10, 'r1')],
            fame: 100,
          } as any,
        ]
      );
      const res1 = resolveImpacts(rivalWin, [processHallOfFame(rivalWin, 1)]);
      expect(res1.rivals.find((r) => r.id === 'r1')?.fame).toBe(130);

      const playerWin = yearEndState(
        [mkW('w1', 'PA', 9, 0, 10, 'p1')],
        [
          {
            id: 'r1',
            owner: { id: 'r1', stableName: 'RivalStable' },
            roster: [mkW('w3', 'RA', 2, 0, 10, 'r1')],
            fame: 100,
          } as any,
        ]
      );
      const res2 = resolveImpacts(playerWin, [processHallOfFame(playerWin, 1)]);
      expect(res2.awards?.find((a) => a.type === 'STABLE_OF_YEAR')?.stableId).toBe('p1');
      expect(res2.fame).toBe(30);
    });

    it('awards TOURNAMENT_RANK to the top medal-delta warrior (3/2/1 weighting)', () => {
      const withMedals = (
        id: string,
        name: string,
        medals: { gold: number; silver: number; bronze: number },
        snapMedals: { gold: number; silver: number; bronze: number } | undefined,
        stableId: string
      ): Warrior =>
        ({
          ...mkW(id, name, 1, 0, 10, stableId),
          career: { wins: 1, losses: 0, kills: 0, medals },
          yearlySnapshots: {
            1: { wins: 0, losses: 0, kills: 0, fame: 0, medals: snapMedals },
          },
        }) as Warrior;

      const state = yearEndState(
        [
          // 2 new golds = score 6
          withMedals('m1', 'Silver', { gold: 2, silver: 0, bronze: 0 }, undefined, 'p1'),
          // 1 gold + 2 silver delta = score 7 — beats m1 despite fewer medals
          withMedals(
            'm2',
            'Broad',
            { gold: 1, silver: 2, bronze: 0 },
            { gold: 0, silver: 0, bronze: 0 },
            'p1'
          ),
          // 3 golds earned BEFORE the snapshot — delta 0, must not win
          withMedals(
            'm3',
            'Stale',
            { gold: 3, silver: 0, bronze: 0 },
            { gold: 3, silver: 0, bronze: 0 },
            'p1'
          ),
        ],
        []
      );

      const res = resolveImpacts(state, [processHallOfFame(state, 1)]);
      const tourney = res.awards?.find((a) => a.type === 'TOURNAMENT_RANK');
      expect(tourney).toBeDefined();
      expect(tourney?.warriorId).toBe('m2');
      expect(tourney?.warriorName).toBe('Broad');
      expect(tourney?.value).toBe(7);
    });

    it('skips TOURNAMENT_RANK when no warrior earned medals that year', () => {
      const state = yearEndState([mkW('w1', 'Plain', 5, 0, 10, 'p1')], []);
      const res = resolveImpacts(state, [processHallOfFame(state, 1)]);
      expect(res.awards?.some((a) => a.type === 'TOURNAMENT_RANK')).toBe(false);
    });

    it('keeps every fame bump + record when one warrior wins multiple awards', () => {
      // Sole eligible warrior wins WOTY (+50) and CLASS_MVP (+20)
      const state = yearEndState([mkW('w1', 'Sweeper', 10, 3, 10, 'p1')], []);
      const res = resolveImpacts(state, [processHallOfFame(state, 1)]);
      const w1 = res.roster.find((w) => w.id === 'w1');
      expect(w1?.fame).toBe(130); // 10 + 50(WOTY) + 50(KOTY) + 20(MVP)
      expect(w1?.awards).toHaveLength(3); // WOTY + KOTY + CLASS_MVP
      expect(res.awards?.filter((a) => a.warriorId === 'w1')).toHaveLength(3);
    });
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
      hallOfFame: [{ id: 'h1', week: 7, label: 'Fight of the Week' as const, fightId: 'f1' }],
    } as unknown as GameState;

    expect(recordWeeklyHallOfFame(state)).toEqual({});
  });
});
