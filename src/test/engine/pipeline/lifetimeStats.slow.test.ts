/**
 * Lifetime stats (register F3 residual) — all-time world counters that survive
 * arenaHistory/graveyard truncation, accumulated in finalizeState.
 */
import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('lifetimeStats accumulation', () => {
  it('counts new bouts/kills each week and accumulates across weeks', async () => {
    const s0 = populateInitialWorld(createFreshState('lt-seed'), 4242);
    expect(s0.lifetimeStats).toBeUndefined();

    let cur = s0;
    for (let w = 0; w < 4; w++) {
      const prev = cur;
      cur = await advanceWeek(prev);
      drainDeferredBoutLogs(cur);
      // Each week, counters grow by exactly the new ids added to each array.
      const newBouts = cur.arenaHistory.length - prev.arenaHistory.length;
      const newKills = cur.graveyard.length - prev.graveyard.length;
      expect(cur.lifetimeStats?.bouts).toBe((prev.lifetimeStats?.bouts ?? 0) + newBouts);
      expect(cur.lifetimeStats?.kills).toBe((prev.lifetimeStats?.kills ?? 0) + newKills);
    }

    // Four weeks of a populated world must produce real activity — the world
    // is alive, and the counters captured all of it.
    expect(cur.lifetimeStats!.bouts).toBeGreaterThan(0);
    expect(cur.lifetimeStats!.bouts).toBe(cur.arenaHistory.length);
    expect(cur.lifetimeStats!.kills).toBe(cur.graveyard.length);
    expect(cur.lifetimeStats!.retirements).toBe(cur.retired.length);
  });

  it('survives a week with no bouts without drifting', async () => {
    const s0 = populateInitialWorld(createFreshState('lt-seed-2'), 7);
    const empty = {
      ...s0,
      rivals: [],
      roster: [],
      boutOffers: {},
      treasury: 999999,
    };
    const w1 = await advanceWeek(empty);
    drainDeferredBoutLogs(w1);
    expect(w1.lifetimeStats?.bouts).toBe(0);
    expect(w1.lifetimeStats?.kills).toBe(0);
  });
});
