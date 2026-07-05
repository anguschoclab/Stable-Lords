import { describe, it, expect } from 'vitest';
import {
  getRecentFightsForWarrior,
  getFightsForWeek,
  getRecentFights,
  getAllFightsForWarrior,
  getFightsForArena,
  getFightsForTournament,
} from '@/engine/core/historyUtils';
import { FightingStyle, type FightSummary } from '@/types/game';
import type { FightId, WarriorId, TournamentId } from '@/types/shared.types';

function createMockFight(
  opts: {
    warriorIdA?: string;
    warriorIdD?: string;
    week?: number;
    arenaId?: string;
    tournamentId?: string | null;
  } = {}
): FightSummary {
  return {
    id: 'mock-id' as FightId,
    title: 'Mock Fight',
    warriorIdA: (opts.warriorIdA ?? 'Attacker') as WarriorId,
    warriorIdD: (opts.warriorIdD ?? 'Defender') as WarriorId,
    winner: 'A',
    by: 'KO',
    styleA: FightingStyle.StrikingAttack as string,
    styleD: FightingStyle.ParryRiposte as string,
    week: opts.week ?? 1,
    createdAt: new Date().toISOString(),
    transcript: [],
    arenaId: opts.arenaId,
    tournamentId: opts.tournamentId as TournamentId | undefined,
  } as FightSummary;
}

describe('getRecentFightsForWarrior', () => {
  it('returns empty array when history is empty', () => {
    const history: FightSummary[] = [];
    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toEqual([]);
  });

  it('returns empty array when warrior is not in history', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Alpha', warriorIdD: 'Beta' }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta' }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toEqual([]);
  });

  it('finds fights where warrior is attacker', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Beta', week: 1 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 2 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Epsilon', week: 3 }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.week)).toEqual([1, 3]); // Expect chronological order
  });

  it('finds fights where warrior is defender', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Alpha', warriorIdD: 'Hero', week: 1 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 2 }),
      createMockFight({ warriorIdA: 'Epsilon', warriorIdD: 'Hero', week: 3 }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.week)).toEqual([1, 3]);
  });

  it('finds fights where warrior is both attacker and defender across different fights', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Alpha', week: 1 }),
      createMockFight({ warriorIdA: 'Beta', warriorIdD: 'Hero', week: 2 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 3 }),
    ];
    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.week)).toEqual([1, 2]);
  });

  it('limits the results and returns the most recent fights chronologically', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'B', week: 2 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'C', week: 3 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'D', week: 4 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'E', week: 5 }),
    ];

    // Default limit is 10, passing an explicit limit of 3
    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId, 3);

    expect(result).toHaveLength(3);
    // Should get weeks 3, 4, 5, returned in chronological order
    expect(result.map((f) => f.week)).toEqual([3, 4, 5]);
  });

  it('uses the default limit of 10', () => {
    const history: FightSummary[] = Array.from({ length: 15 }).map((_, i) =>
      createMockFight({ warriorIdA: 'Hero', warriorIdD: `Opponent${i}`, week: i + 1 })
    );

    const result = getRecentFightsForWarrior(history, 'Hero' as WarriorId);

    expect(result).toHaveLength(10);
    // Should get the last 10 weeks (weeks 6 through 15) in chronological order
    expect(result.map((f) => f.week)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });
});

describe('getFightsForWeek', () => {
  it('returns empty array when history is empty', () => {
    expect(getFightsForWeek([], 5)).toEqual([]);
  });

  it('returns fights matching the given week', () => {
    const history: FightSummary[] = [
      createMockFight({ week: 1 }),
      createMockFight({ week: 3 }),
      createMockFight({ week: 3 }),
      createMockFight({ week: 5 }),
    ];
    const result = getFightsForWeek(history, 3);
    expect(result).toHaveLength(2);
    expect(result.every((f) => f.week === 3)).toBe(true);
  });

  it('returns fights in chronological order', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A1', warriorIdD: 'D1', week: 3 }),
      createMockFight({ warriorIdA: 'A2', warriorIdD: 'D2', week: 3 }),
      createMockFight({ warriorIdA: 'A3', warriorIdD: 'D3', week: 5 }),
    ];
    const result = getFightsForWeek(history, 3);
    expect(result.map((f) => f.warriorIdA)).toEqual(['A1', 'A2']);
  });

  it('breaks early when encountering fights with week < target', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'W1', week: 1 }),
      createMockFight({ warriorIdA: 'W2', week: 3 }),
      createMockFight({ warriorIdA: 'W3', week: 5 }),
    ];
    const result = getFightsForWeek(history, 5);
    expect(result).toHaveLength(1);
    expect(result[0]!.warriorIdA).toBe('W3');
  });

  it('returns empty array when no fights match the target week', () => {
    const history: FightSummary[] = [createMockFight({ week: 1 }), createMockFight({ week: 2 })];
    expect(getFightsForWeek(history, 99)).toEqual([]);
  });

  it('handles fights at week 0', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Zero', week: 0 }),
      createMockFight({ warriorIdA: 'One', week: 1 }),
    ];
    const result = getFightsForWeek(history, 0);
    expect(result).toHaveLength(1);
    expect(result[0]!.warriorIdA).toBe('Zero');
  });
});

describe('getRecentFights', () => {
  it('returns empty array when history is empty', () => {
    expect(getRecentFights([], 1)).toEqual([]);
  });

  it('returns all fights with week >= minWeek', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'B', week: 3 }),
      createMockFight({ warriorIdA: 'C', week: 5 }),
    ];
    const result = getRecentFights(history, 3);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.warriorIdA)).toEqual(['B', 'C']);
  });

  it('returns fights in chronological order', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 3 }),
      createMockFight({ warriorIdA: 'B', week: 5 }),
    ];
    const result = getRecentFights(history, 1);
    expect(result.map((f) => f.warriorIdA)).toEqual(['A', 'B']);
  });

  it('breaks early when encountering fights with week < minWeek', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'B', week: 2 }),
      createMockFight({ warriorIdA: 'C', week: 5 }),
    ];
    const result = getRecentFights(history, 5);
    expect(result).toHaveLength(1);
    expect(result[0]!.warriorIdA).toBe('C');
  });

  it('returns empty array when all fights are before minWeek', () => {
    const history: FightSummary[] = [createMockFight({ week: 1 }), createMockFight({ week: 2 })];
    expect(getRecentFights(history, 10)).toEqual([]);
  });

  it('returns all fights when minWeek is 0', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'B', week: 5 }),
    ];
    const result = getRecentFights(history, 0);
    expect(result).toHaveLength(2);
  });
});

describe('getAllFightsForWarrior', () => {
  it('returns empty array when history is empty', () => {
    expect(getAllFightsForWarrior([], 'Hero' as WarriorId)).toEqual([]);
  });

  it('returns all fights where warrior is attacker', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'Other', warriorIdD: 'B', week: 2 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'C', week: 3 }),
    ];
    const result = getAllFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.week)).toEqual([1, 3]);
  });

  it('returns all fights where warrior is defender', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', warriorIdD: 'Hero', week: 1 }),
      createMockFight({ warriorIdA: 'B', warriorIdD: 'Other', week: 2 }),
      createMockFight({ warriorIdA: 'C', warriorIdD: 'Hero', week: 3 }),
    ];
    const result = getAllFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.week)).toEqual([1, 3]);
  });

  it('returns all fights where warrior is both attacker and defender across different fights', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'Alpha', week: 1 }),
      createMockFight({ warriorIdA: 'Beta', warriorIdD: 'Hero', week: 2 }),
      createMockFight({ warriorIdA: 'Gamma', warriorIdD: 'Delta', week: 3 }),
    ];
    const result = getAllFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.week)).toEqual([1, 2]);
  });

  it('returns fights in chronological order (forward loop, no reverse)', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'A', week: 1 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'B', week: 2 }),
      createMockFight({ warriorIdA: 'Hero', warriorIdD: 'C', week: 3 }),
    ];
    const result = getAllFightsForWarrior(history, 'Hero' as WarriorId);
    expect(result.map((f) => f.week)).toEqual([1, 2, 3]);
  });

  it('returns empty array when warrior not in any fight', () => {
    const history: FightSummary[] = [createMockFight({ warriorIdA: 'A', warriorIdD: 'B' })];
    expect(getAllFightsForWarrior(history, 'Nobody' as WarriorId)).toEqual([]);
  });
});

describe('getFightsForArena', () => {
  it('returns empty array when history is empty', () => {
    expect(getFightsForArena([], 'arena1')).toEqual([]);
  });

  it('returns all fights matching the arenaId', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1, arenaId: 'arena1' }),
      createMockFight({ warriorIdA: 'B', week: 2, arenaId: 'arena2' }),
      createMockFight({ warriorIdA: 'C', week: 3, arenaId: 'arena1' }),
    ];
    const result = getFightsForArena(history, 'arena1');
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.warriorIdA)).toEqual(['A', 'C']);
  });

  it('returns empty array when no fights match arenaId', () => {
    const history: FightSummary[] = [
      createMockFight({ arenaId: 'arena1' }),
      createMockFight({ arenaId: 'arena2' }),
    ];
    expect(getFightsForArena(history, 'nonexistent')).toEqual([]);
  });

  it('does full scan (finds matches even when not contiguous)', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', arenaId: 'arena1' }),
      createMockFight({ warriorIdA: 'B', arenaId: 'arena2' }),
      createMockFight({ warriorIdA: 'C', arenaId: 'arena2' }),
      createMockFight({ warriorIdA: 'D', arenaId: 'arena1' }),
    ];
    const result = getFightsForArena(history, 'arena1');
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.warriorIdA)).toEqual(['A', 'D']);
  });

  it('returns fights in chronological order (forward loop)', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1, arenaId: 'arena1' }),
      createMockFight({ warriorIdA: 'B', week: 2, arenaId: 'arena1' }),
      createMockFight({ warriorIdA: 'C', week: 3, arenaId: 'arena1' }),
    ];
    const result = getFightsForArena(history, 'arena1');
    expect(result.map((f) => f.week)).toEqual([1, 2, 3]);
  });
});

describe('getFightsForTournament', () => {
  it('returns empty array when history is empty', () => {
    expect(getFightsForTournament([], 't1')).toEqual([]);
  });

  it('returns all fights matching the tournamentId', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1, tournamentId: 't1' }),
      createMockFight({ warriorIdA: 'B', week: 2, tournamentId: 't2' }),
      createMockFight({ warriorIdA: 'C', week: 3, tournamentId: 't1' }),
    ];
    const result = getFightsForTournament(history, 't1');
    expect(result).toHaveLength(2);
    expect(result.map((f) => f.warriorIdA)).toEqual(['A', 'C']);
  });

  it('returns empty array when no fights match tournamentId', () => {
    const history: FightSummary[] = [
      createMockFight({ tournamentId: 't1' }),
      createMockFight({ tournamentId: 't2' }),
    ];
    expect(getFightsForTournament(history, 'nonexistent')).toEqual([]);
  });

  it('returns fights in chronological order (reverse of backward collection)', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1, tournamentId: 't1' }),
      createMockFight({ warriorIdA: 'B', week: 2, tournamentId: 't1' }),
      createMockFight({ warriorIdA: 'C', week: 3, tournamentId: 't1' }),
    ];
    const result = getFightsForTournament(history, 't1');
    expect(result.map((f) => f.warriorIdA)).toEqual(['A', 'B', 'C']);
  });

  it('handles fights with tournamentId null or undefined (should not match)', () => {
    const history: FightSummary[] = [
      createMockFight({ warriorIdA: 'A', week: 1, tournamentId: null }),
      createMockFight({ warriorIdA: 'B', week: 2 }),
      createMockFight({ warriorIdA: 'C', week: 3, tournamentId: 't1' }),
    ];
    const result = getFightsForTournament(history, 't1');
    expect(result).toHaveLength(1);
    expect(result[0]!.warriorIdA).toBe('C');
  });
});
