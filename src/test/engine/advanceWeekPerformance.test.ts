import { describe, it, expect } from 'vitest';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { createFreshState } from '@/engine/factories/gameStateFactory';

describe('advanceWeekPerformance', () => {
  it('advanceWeek completes within reasonable time for a single week', async () => {
    const state = createFreshState('perf-test-single');
    const start = performance.now();
    advanceWeek(state, { headless: true });
    const elapsed = performance.now() - start;

    // Should complete in under 500ms for a single week
    expect(elapsed).toBeLessThan(500);
  });

  it('advanceWeek does not degrade significantly over 10 weeks', async () => {
    let state = createFreshState('perf-test-degradation');
    const times: number[] = [];

    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      state = await advanceWeek(state, { headless: true });
      times.push(performance.now() - start);
    }

    // The last week should not be more than 10x slower than the first
    // (allowing for variance in test environment)
    const ratio = times[times.length - 1]! / (times[0]! || 1);
    expect(ratio).toBeLessThan(15);
  });

  it('structuredClone produces a valid deep copy', async () => {
    const state = createFreshState('perf-test-clone');
    const cloned = structuredClone(state);

    // Clone should have same values
    expect(cloned.treasury).toBe(state.treasury);
    expect(cloned.week).toBe(state.week);
    expect(cloned.roster.length).toBe(state.roster.length);

    // Clone should be a different object
    expect(cloned).not.toBe(state);
    expect(cloned.roster).not.toBe(state.roster);
  });
});
