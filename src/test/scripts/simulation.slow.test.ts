import { describe, test, expect, vi, beforeEach } from 'vitest';
import { runSimulation } from '#scripts/simulation-harness';
import { setMockIdGenerator } from '@/utils/idUtils';
import { engineEventBus } from '@/engine/core/EventBus';

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

function resetGlobalState() {
  let idCounter = 0;
  setMockIdGenerator(() => `id_${++idCounter}`);
  engineEventBus.clear();
}

describe('Headless Simulation Harness', () => {
  beforeEach(() => {
    resetGlobalState();
  }, 120000);

  test('runs a long-term balance check (52 weeks)', async () => {
    const seed = 999;
    const config = {
      weeks: 52,
      seed,
      logFrequency: 4, // Log every month to trace progress
    };

    console.log(`\n[Sim] Starting 52-week balance check with seed: ${seed}`);
    const result = await runSimulation(config);

    console.log('SUCCESS');
    expect(result.finalState).toBeDefined();
    expect(result.finalState.absoluteWeek).toBeGreaterThanOrEqual(52);
    expect(result.pulses.length).toBeGreaterThan(0);
    expect(result.cumulative).toBeDefined();
  }, 300000);
});
