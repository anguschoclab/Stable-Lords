/**
 * Tournament resolution — verifies updateEntityInList is used correctly
 * in awards.ts modifyWarrior for O(1) targeted roster/rival updates,
 * and that applyBoutResults correctly updates warriors.
 */
import { describe, it, expect } from 'vitest';
import { updateEntityInList } from '@/utils/stateUtils';
import { modifyWarrior } from '@/engine/matchmaking/tournamentSelection/awards';
import { applyBoutResults } from '@/engine/matchmaking/tournamentSelection/resolution';
import { SeededRNG } from '@/utils/random';
import type { GameState, Warrior } from '@/types/state.types';
import type { FightOutcome } from '@/types/combat.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import {
  makeWarrior as fixtureWarrior,
  makeGameState as fixtureGameState,
} from '@/test/_fixtures/factories';

const makeWarrior = (id: string, name: string, stableId?: string): Warrior =>
  fixtureWarrior({
    id,
    name,
    style: 'Brawler',
    stableId: (stableId ?? 'player') as StableId,
    attributes: { ST: 10, SP: 10, DF: 10, WT: 10 },
    baseSkills: { ATT: 5, DEF: 5, RIP: 5, RHY: 5 },
    career: { wins: 0, losses: 0, kills: 0, deaths: 0, tournaments: 0 },
    fame: 0,
    age: 20,
    traits: [],
    status: 'Active',
  } as any);

const makeState = (roster: Warrior[], rivals: { id: string; roster: Warrior[] }[]): GameState =>
  fixtureGameState({
    roster,
    rivals: rivals as any,
    player: { id: 'player' },
    week: 1,
    absoluteWeek: 1,
  } as any);

describe('tournament resolution — updateEntityInList usage', () => {
  it('modifyWarrior updates roster warrior via updateEntityInList', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const state = makeState([w1], []);

    const result = modifyWarrior(state, 'w1' as WarriorId, (draft) => {
      draft.fame = 100;
    });

    expect(result.roster[0]?.fame).toBe(100);
    expect(result.roster[0]).not.toBe(w1); // new object
  });

  it('modifyWarrior updates rival roster warrior when not in player roster', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const w2 = makeWarrior('w2', 'Fighter2', 'rival1');
    const state = makeState([w1], [{ id: 'rival1', roster: [w2] }]);

    const result = modifyWarrior(state, 'w2' as WarriorId, (draft) => {
      draft.fame = 50;
    });

    expect(result.rivals[0]?.roster[0]?.fame).toBe(50);
    expect(result.rivals[0]?.roster[0]).not.toBe(w2);
  });

  it('modifyWarrior preserves other warriors immutably', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const w2 = makeWarrior('w2', 'Fighter2', 'player');
    const state = makeState([w1, w2], []);

    const result = modifyWarrior(state, 'w1' as WarriorId, (draft) => {
      draft.fame = 100;
    });

    expect(result.roster[1]).toBe(w2); // same reference — not cloned
  });

  it('updateEntityInList returns same array ref when warrior not in roster', () => {
    const w1 = makeWarrior('w1', 'Fighter1', 'player');
    const roster = [w1];
    const result = updateEntityInList(roster, 'missing', (w) => ({ ...w, fame: 99 }));
    expect(result).toBe(roster);
  });
});

describe('applyBoutResults — arena attribution', () => {
  it('records the simulated arenaId on the persisted FightSummary', () => {
    const wA = makeWarrior('wA', 'Challenger', 'player');
    const wD = makeWarrior('wD', 'Defender', 'rival1');
    const state = makeState([wA], [{ id: 'rival1', roster: [wD] }]);

    const outcome = { winner: 'A', by: 'Decision', log: [] } as unknown as FightOutcome;
    const result = applyBoutResults(
      { state: state, wA: wA, wD: wD, outcome: outcome, tId: 't1', tName: 'Gold Cup', rng: new SeededRNG(12345), skipFatigue: true, arenaId: 'sundered_coliseum' }
    );

    const summary = result.arenaHistory[result.arenaHistory.length - 1];
    expect(summary?.arenaId).toBe('sundered_coliseum');
  });
});

describe('applyBoutResults — career.byArena accounting', () => {
  it('records win/loss at the tournament arena for roster and rival warriors', () => {
    const wA = makeWarrior('wA', 'Challenger', 'player');
    const wD = makeWarrior('wD', 'Defender', 'rival1');
    const state = makeState([wA], [{ id: 'rival1', roster: [wD] }]);

    const outcome = { winner: 'A', by: 'Decision', log: [] } as unknown as FightOutcome;
    const result = applyBoutResults(
      { state: state, wA: wA, wD: wD, outcome: outcome, tId: 't1', tName: 'Gold Cup', rng: new SeededRNG(12345), skipFatigue: true, arenaId: 'sundered_coliseum' }
    );

    expect(result.roster[0]?.career.byArena?.sundered_coliseum).toEqual({
      wins: 1,
      losses: 0,
      kills: 0,
    });
    expect(result.rivals[0]?.roster[0]?.career.byArena?.sundered_coliseum).toEqual({
      wins: 0,
      losses: 1,
      kills: 0,
    });
  });

  it('preserves pre-existing byArena records and credits tournament kills to the winner', () => {
    const wA = makeWarrior('wA', 'Challenger', 'player');
    wA.career = {
      ...wA.career,
      wins: 3,
      kills: 1,
      byArena: {
        sundered_coliseum: { wins: 2, losses: 1, kills: 1 },
        other_arena: { wins: 7, losses: 0, kills: 0 },
      },
      medals: { gold: 1, silver: 0, bronze: 0 },
    };
    const wD = makeWarrior('wD', 'Defender', 'rival1');
    const state = makeState([wA], [{ id: 'rival1', roster: [wD] }]);

    const outcome = { winner: 'A', by: 'Kill', log: [] } as unknown as FightOutcome;
    const result = applyBoutResults(
      { state: state, wA: wA, wD: wD, outcome: outcome, tId: 't1', tName: 'Gold Cup', rng: new SeededRNG(12345), skipFatigue: true, arenaId: 'sundered_coliseum' }
    );

    const winner = result.roster.find((w) => w.id === 'wA');
    expect(winner?.career.byArena?.sundered_coliseum).toEqual({ wins: 3, losses: 1, kills: 2 });
    expect(winner?.career.byArena?.other_arena).toEqual({ wins: 7, losses: 0, kills: 0 });
    expect(winner?.career.medals).toEqual({ gold: 1, silver: 0, bronze: 0 });
    // Victim is moved to the graveyard rather than left in a roster
    expect(result.graveyard.some((w) => w.id === 'wD')).toBe(true);
  });
});
