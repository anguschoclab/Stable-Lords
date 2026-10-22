import { describe, it, expect, vi } from 'vitest';

const perceptionSpy = vi.fn();
vi.mock('@/engine/ai/memory/perceptionSnapshot', async (orig) => {
  const m = await orig<typeof import('@/engine/ai/memory/perceptionSnapshot')>();
  return {
    ...m,
    buildPerceptionSnapshot: (...args: Parameters<typeof m.buildPerceptionSnapshot>) => {
      perceptionSpy();
      return m.buildPerceptionSnapshot(...args);
    },
  };
});

import { runRivalStrategyPass } from '@/engine/pipeline/passes/RivalStrategyPass';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { SeededRNG } from '@/utils/random';
import { setMockIdGenerator } from '@/utils/idUtils';

describe('RivalStrategyPass perf gate', () => {
  it('builds perception exactly once per tick and stays under the time bound', async () => {
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);

    // Best-of-3 on freshly populated worlds — the slow suite runs this file
    // concurrently with 104-week sims, so a single wall-clock sample can be
    // inflated several-fold by CPU contention (observed ~640–1140ms under
    // load vs ~250–310ms in isolation). The min is the honest signal.
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const state = populateInitialWorld(createFreshState('perf-seed'), 4242);
      perceptionSpy.mockClear();
      const start = performance.now();
      runRivalStrategyPass(state, state.week + 1, new SeededRNG(1), true);
      best = Math.min(best, performance.now() - start);
      // B.1 contract: one shared perception context per tick, not per-rival scans.
      expect(perceptionSpy).toHaveBeenCalledTimes(1);
    }
    // Perf bound — measured 43–73ms on dev hardware at implementation time
    // (recorded in docs/ai-behavior-audit.md), ~250–310ms today. 2000ms keeps
    // ~6× headroom over a loaded min-of-3 while still catching a reintroduced
    // per-rival world scan (also caught by the spy assertion above) or the
    // structuredClone-per-rival churn removed in G17 — both are ~10×+ events.
    expect(best).toBeLessThan(2000);
    console.log(`[perf] RivalStrategyPass populated-world tick: ${best.toFixed(1)}ms (best of 3)`);
  }, 60000);
});
