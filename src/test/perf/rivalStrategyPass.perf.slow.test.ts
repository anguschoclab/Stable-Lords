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
import { SeededRNGService } from '@/utils/random';
import { setMockIdGenerator } from '@/utils/idUtils';

describe('RivalStrategyPass perf gate (I.2)', () => {
  it('builds perception exactly once per tick and stays under the time bound', async () => {
    let n = 0;
    setMockIdGenerator(() => `id_${++n}`);

    const state = populateInitialWorld(createFreshState('perf-seed'), 4242);
    perceptionSpy.mockClear();

    const start = performance.now();
    runRivalStrategyPass(state, state.week + 1, new SeededRNGService(1), true);
    const elapsed = performance.now() - start;

    // B.1 contract: one shared perception context per tick, not per-rival scans.
    expect(perceptionSpy).toHaveBeenCalledTimes(1);
    // Perf bound — measured ~Xms at implementation time; 3s ceiling guards
    // against reintroducing per-rival world scans or clone churn (G17).
    expect(elapsed).toBeLessThan(3000);
    console.log(`[perf] RivalStrategyPass populated-world tick: ${elapsed.toFixed(1)}ms`);
  }, 60000);
});
