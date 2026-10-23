/**
 * weeklyBreakdown.arenaTier fallback contract.
 *
 * A missing arenaId resolves to tier-1 fight economics without touching the
 * arena registry. Unknown ids resolve through getArenaById's defaultArena
 * fallback (pinned at data/arenas/index.ts), so the lookup cannot throw in
 * production — the defensive catch that once lived here was removed as dead
 * code, consistent with every other getArenaById caller. These specs pin the
 * contract that remains: the early return and the honest propagation of a
 * genuinely broken registry.
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

describe('computeWeeklyBreakdown — arenaTier lookup contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('propagates a registry failure instead of silently degrading to tier 1', () => {
    const input = economyInput([
      makeFightSummary({ week: 1, warriorIdA: 'p1' as never, winner: 'A', arenaId: 'ghost_arena', fameA: 0 }),
    ]);

    expect(() => computeWeeklyBreakdown(input)).toThrow('arena registry unavailable');
  });
});
