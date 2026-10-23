/**
 * weeklyBreakdown.arenaTier error path — an arena lookup that throws (e.g. a
 * registry with no default) must fall back to tier-1 fight economics instead
 * of sinking the weekly ledger.
 *
 * getArenaById cannot throw for an unknown id in production — index.ts pins
 * `defaultArena` — so the catch is exercised by mocking the module. Kept as
 * regression armor: if the default-arena fallback is ever removed, this guard
 * is the only thing between a legacy arenaId and a thrown week.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/data/arenas', () => ({
  getArenaById: vi.fn(() => {
    throw new Error('arena registry unavailable');
  }),
}));

import { computeWeeklyBreakdown, type StableEconomyInput } from '@/engine/economy/weeklyBreakdown';
import { computeFightEconomics } from '@/constants/economy';
import { makeWarrior, makeFightSummary } from '@/test/_fixtures/factories';
import type { FightSummary } from '@/types/combat.types';

function economyInput(arenaHistory: FightSummary[]): StableEconomyInput {
  return {
    week: 1,
    roster: [makeWarrior({ id: 'p1' as never, fame: 0 })],
    fame: 0,
    weather: 'Clear',
    arenaHistory,
    trainers: [],
    trainingAssignments: [],
    isPlayer: true,
  };
}

describe('computeWeeklyBreakdown — arenaTier catch fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to tier-1 economics when the arena lookup throws', () => {
    const input = economyInput([
      makeFightSummary({ week: 1, warriorIdA: 'p1' as never, winner: 'A', arenaId: 'ghost_arena', fameA: 0 }),
    ]);

    const b = computeWeeklyBreakdown(input);
    const purse = b.income.find((i) => i.label === 'Fight purses (1)');
    const expected = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    expect(purse?.amount).toBe(expected.purse);
  });

  it('skips the lookup entirely for a missing arenaId', async () => {
    const { getArenaById } = await import('@/data/arenas');
    const input = economyInput([
      makeFightSummary({ week: 1, warriorIdA: 'p1' as never, winner: 'A', fameA: 0 }),
    ]);

    const b = computeWeeklyBreakdown(input);
    const purse = b.income.find((i) => i.label === 'Fight purses (1)');
    const expected = computeFightEconomics({ fame: 0, arenaTier: 1, won: true });
    expect(purse?.amount).toBe(expected.purse);
    expect(vi.mocked(getArenaById)).not.toHaveBeenCalled();
  });
});
