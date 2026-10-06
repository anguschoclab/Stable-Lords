import { describe, it, expect } from 'vitest';
import {
  getFightsForWeek,
  getRecentFights,
  getRecentFightsForWarrior,
  getAllFightsForWarrior,
  getFightsForArena,
  getFightsForTournament,
  buildRecentFightPairs
} from '@/engine/core/historyUtils';
import type { FightSummary } from '@/types/combat.types';

describe('historyUtils', () => {
  const createFight = (overrides: Partial<FightSummary>) => ({
    absoluteWeek: 1,
    week: 1,
    warriorIdA: 'a',
    warriorIdD: 'b',
    arenaId: 'arena1',
    tournamentId: undefined,
    ...overrides
  } as unknown as FightSummary);

  const history = [
    createFight({ absoluteWeek: 1, week: 1, warriorIdA: 'w1', warriorIdD: 'w2' }),
    createFight({ absoluteWeek: 2, week: 2, warriorIdA: 'w3', warriorIdD: 'w4' }),
    createFight({ absoluteWeek: 2, week: 2, warriorIdA: 'w1', warriorIdD: 'w5', arenaId: 'arena2', tournamentId: 't1' }),
    createFight({ absoluteWeek: 3, week: 3, warriorIdA: 'w6', warriorIdD: 'w7' }),
    createFight({ absoluteWeek: 4, week: 4, warriorIdA: 'w1', warriorIdD: 'w8' }),
  ];

  it('getFightsForWeek', () => {
    const fights = getFightsForWeek(history, 2);
    expect(fights).toHaveLength(2);
    expect(fights[0].warriorIdA).toBe('w3');
    expect(fights[1].warriorIdA).toBe('w1');

    expect(getFightsForWeek(history, 5)).toHaveLength(0);
    // with falsy values in array
    const sparseHistory = [...history, null as any, createFight({ absoluteWeek: 5, week: 5 })];
    expect(getFightsForWeek(sparseHistory, 5)).toHaveLength(1);
  });

  it('getRecentFights', () => {
    const fights = getRecentFights(history, 3);
    expect(fights).toHaveLength(2);
    expect(fights[0].absoluteWeek).toBe(3);
    expect(fights[1].absoluteWeek).toBe(4);

    // Check fallback to week if absoluteWeek is missing
    const legacyHistory = [
      createFight({ absoluteWeek: undefined, week: 1 }),
      createFight({ absoluteWeek: undefined, week: 2 })
    ];
    expect(getRecentFights(legacyHistory, 2)).toHaveLength(1);
  });

  it('getRecentFightsForWarrior', () => {
    const fights = getRecentFightsForWarrior(history, 'w1', 2);
    expect(fights).toHaveLength(2);
    // Should be chronological (because of .reverse())
    expect(fights[0].absoluteWeek).toBe(2); // w1 vs w5
    expect(fights[1].absoluteWeek).toBe(4); // w1 vs w8

    const allFights = getRecentFightsForWarrior(history, 'w1', 10);
    expect(allFights).toHaveLength(3);
  });

  it('getAllFightsForWarrior', () => {
    const fights = getAllFightsForWarrior(history, 'w1');
    expect(fights).toHaveLength(3);
    expect(fights[0].absoluteWeek).toBe(1);
    expect(fights[2].absoluteWeek).toBe(4);
  });

  it('getFightsForArena', () => {
    const fights = getFightsForArena(history, 'arena2');
    expect(fights).toHaveLength(1);
    expect(fights[0].warriorIdD).toBe('w5');
  });

  it('getFightsForTournament', () => {
    const fights = getFightsForTournament(history, 't1');
    expect(fights).toHaveLength(1);
    expect(fights[0].warriorIdA).toBe('w1');
  });

  it('buildRecentFightPairs', () => {
    const pairs = buildRecentFightPairs(history, 3, 3); // min week 0
    // expects pairs for weeks 1, 2, 3, 4
    // 'w1_w2', 'w3_w4', 'w1_w5', 'w6_w7', 'w1_w8'
    expect(pairs.size).toBe(5);
    expect(pairs.has('w1|w2')).toBe(true);
    expect(pairs.has('w6|w7')).toBe(true);

    const narrowPairs = buildRecentFightPairs(history, 4, 1); // min week 3
    expect(narrowPairs.size).toBe(2); // w6_w7, w1_w8
    expect(narrowPairs.has('w1|w8')).toBe(true);
  });
});

describe('buildRecentFightPairs edge cases', () => {
  it('builds recent fight pairs', () => {
    const createFight = (overrides) => ({
      absoluteWeek: 1, week: 1, warriorIdA: 'a', warriorIdD: 'b', arenaId: 'arena1', ...overrides
    });
    const history = [
      createFight({ absoluteWeek: 1, week: 1, warriorIdA: 'w1', warriorIdD: 'w2' }),
      createFight({ absoluteWeek: 2, week: 2, warriorIdA: 'w3', warriorIdD: 'w4' }),
      createFight({ absoluteWeek: 2, week: 2, warriorIdA: 'w1', warriorIdD: 'w5', arenaId: 'arena2', tournamentId: 't1' }),
      createFight({ absoluteWeek: 3, week: 3, warriorIdA: 'w6', warriorIdD: 'w7' }),
      createFight({ absoluteWeek: 4, week: 4, warriorIdA: 'w1', warriorIdD: 'w8' }),
    ];

    const pairs = buildRecentFightPairs(history, 3, 3);
    expect(pairs.size).toBe(5);
    expect(pairs.has('w1|w2')).toBe(true);
    expect(pairs.has('w6|w7')).toBe(true);

    const narrowPairs = buildRecentFightPairs(history, 4, 1);
    expect(narrowPairs.size).toBe(2);
    expect(narrowPairs.has('w1|w8')).toBe(true);
  });
});

describe('buildRecentFightPairs edge cases', () => {
  it('builds recent fight pairs', () => {
    const createFight = (overrides) => ({
      absoluteWeek: 1, week: 1, warriorIdA: 'a', warriorIdD: 'b', arenaId: 'arena1', ...overrides
    });
    const history = [
      createFight({ absoluteWeek: 1, week: 1, warriorIdA: 'w1', warriorIdD: 'w2' }),
      createFight({ absoluteWeek: 2, week: 2, warriorIdA: 'w3', warriorIdD: 'w4' }),
      createFight({ absoluteWeek: 2, week: 2, warriorIdA: 'w1', warriorIdD: 'w5', arenaId: 'arena2', tournamentId: 't1' }),
      createFight({ absoluteWeek: 3, week: 3, warriorIdA: 'w6', warriorIdD: 'w7' }),
      createFight({ absoluteWeek: 4, week: 4, warriorIdA: 'w1', warriorIdD: 'w8' }),
    ];

    const pairs = buildRecentFightPairs(history, 3, 3);
    expect(pairs.size).toBe(5);
    expect(pairs.has('w1|w2')).toBe(true);
    expect(pairs.has('w6|w7')).toBe(true);

    const narrowPairs = buildRecentFightPairs(history, 4, 1);
    expect(narrowPairs.size).toBe(2);
    expect(narrowPairs.has('w1|w8')).toBe(true);
  });
});
