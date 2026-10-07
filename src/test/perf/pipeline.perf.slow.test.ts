import { describe, it, expect, vi, afterEach } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { TimeAdvanceService } from '@/engine/pipeline/tick/timeAdvance';
import { runAutosim } from '@/engine/autosim/autosim';

// Mock the archiver to avoid disk I/O during perf tests
vi.mock('@/engine/pipeline/adapters/opfsArchiver', () => ({
  flushDeferredArchivesOffThread: (state: unknown) => {
    (state as any).deferredBoutLogs = [];
    return state;
  },
}));

describe('Pipeline Performance Benchmarks', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should complete quarter advance within reasonable time', async () => {
    const state = createFreshState('perf-test', '2026-04-28T09:00:00Z');
    const startTime = performance.now();

    const result = await TimeAdvanceService.advanceQuarter(state, {
      headless: true,
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.weeksCompleted).toBe(13);
    // Fresh states floor-refill to ~90 rivals on week 1; the old 5s cap
    // assumed the 8-rival fresh world. Ceiling is catastrophic-regression
    // only: ~1.43s/wk measured at the 160-stable band → ~18.6s/quarter.
    // Precise bands live in the scale-band tests and docs/PIPELINE_BASELINE.md.
    expect(duration).toBeLessThan(20000);
  });

  it('headless mode completes the same span as a bounded quarter', async () => {
    // Replaces a vacuous "faster than full mode" assertion that never measured
    // full mode. Full mode requires feature flags, and a wall-clock comparison
    // on shared CI runners only measures machine noise — assert the contract
    // headless must keep instead: the span still completes.
    const state = createFreshState('perf-test-headless', '2026-04-28T09:00:00Z');
    const result = await TimeAdvanceService.advanceQuarter(state, {
      headless: true,
    });
    expect(result.weeksCompleted).toBe(13);
    expect(result.state.week).not.toBe(1);
  });

  it('autosim should handle large week counts', async () => {
    const state = createFreshState('autosim-perf-test', '2026-04-28T09:00:00Z');
    const weeksToSim = 52; // One year

    const startTime = performance.now();

    const result = await runAutosim(state, {
      weeksToSim,
      stopConditions: [], // perf run must sim the full span, not stop on empty roster
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.weeksSimmed).toBeGreaterThan(0);
    // ~0.4s/week at the 90-rival floor; the old 30s cap assumed 8 rivals.
    expect(duration).toBeLessThan(60000);
  });

  it('should not accumulate excessive memory during batch operations', async () => {
    // This is a basic check - we can't easily measure heap in tests
    // But we can verify the simulation completes without OOM
    const state = createFreshState('memory-test', '2026-04-28T09:00:00Z');

    // Run 4 quarters (1 year) with deferred archives
    let currentState = state;
    for (let q = 0; q < 4; q++) {
      const result = await TimeAdvanceService.advanceQuarter(currentState, {
        headless: true,
      });
      currentState = result.state;

      // Verify deferred logs don't accumulate indefinitely
      // They should be cleared after each quarter flush
      expect((currentState as any).deferredBoutLogs ?? []).toHaveLength(0);
    }

    expect(currentState.year).toBeGreaterThan(1);
  });
});

describe('Determinism vs Performance Trade-offs', () => {
  it('sequential vs batch should produce similar functional state', async () => {
    const FIXED_ISO = '2026-04-28T09:00:00Z';
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue(FIXED_ISO);

    const stateSeq = createFreshState('determinism-perf', FIXED_ISO);
    const stateBatch = createFreshState('determinism-perf', FIXED_ISO);

    // Sequential: 13 individual weeks
    let seqState = stateSeq;
    for (let i = 0; i < 13; i++) {
      const { advanceWeek } = await import('@/engine/pipeline/services/weekPipelineService');
      seqState = await advanceWeek(seqState, { headless: true });
    }

    // Batch: 1 quarter call
    const batchResult = await TimeAdvanceService.advanceQuarter(stateBatch, {
      headless: true,
    });

    // Functional state should match
    expect(batchResult.state.week).toBe(seqState.week);
    expect(batchResult.state.year).toBe(seqState.year);
    expect(batchResult.state.treasury).toBe(seqState.treasury);
    expect(batchResult.state.roster.length).toBe(seqState.roster.length);
  });
});

// ─── Living-world scale bands (megaplan Phase 5) ─────────────────────────────
// Time a populated world at the floor (90 stables) and near the soft cap
// (160 stables). Timings are recorded to the console and gated generously —
// the assertion is "no pathological regression", sub-ms precision lives in
// docs/PIPELINE_BASELINE.md.
describe('Living-world scale bands', () => {
  const measure = async (extraRivals: number, label: string) => {
    const { populateInitialWorld } = await import('@/engine/core/worldSeeder');
    const { generateRivalStables } = await import('@/engine/rivals');
    const { advanceWeek } = await import('@/engine/pipeline/services/weekPipelineService');
    const base = createFreshState(`perf-${label}`, '2026-04-28T09:00:00Z');
    let state = populateInitialWorld(base, 12345);
    if (extraRivals > 0) {
      state = {
        ...state,
        rivals: [
          ...state.rivals,
          ...generateRivalStables(extraRivals, 54321, state.absoluteWeek ?? 0),
        ],
      };
    }

    const weeks = 8;
    const start = performance.now();
    for (let i = 0; i < weeks; i++) {
      state = await advanceWeek(state, { headless: true });
    }
    const msPerWeek = (performance.now() - start) / weeks;
    console.log(`[perf] ${label} (${state.rivals.length} rivals): ${msPerWeek.toFixed(1)} ms/week`);
    return msPerWeek;
  };

  it('90-stable band stays under the perf ceiling', async () => {
    const msPerWeek = await measure(0, '90-stable');
    expect(msPerWeek).toBeLessThan(4000);
  }, 120000);

  it('160-stable band stays under the perf ceiling', async () => {
    const msPerWeek = await measure(70, '160-stable');
    // ~1.4s/week locally, ~3.5s/week on the hosted runner — ceiling carries
    // headroom for CI variance; the real band lives in PIPELINE_BASELINE.md.
    expect(msPerWeek).toBeLessThan(6000);
  }, 180000);
});

// Stress test for long-running simulations
describe('Long-running Simulation Stress Tests', () => {
  it('should handle long simulation without memory issues', async () => {
    const state = createFreshState('stress-test', '2026-04-28T09:00:00Z');
    // Just run 1 year (52 weeks) for the stress test
    // 5 years takes too long for a unit test
    const totalWeeks = 52;

    const result = await runAutosim(state, {
      weeksToSim: totalWeeks,
      stopConditions: [],
    });

    // Just verify it completed some weeks without crashing
    expect(result.weeksSimmed).toBeGreaterThan(0);
    expect(result.stopReason).toBeDefined();
  }, 180000); // ~31s clean; the slow suite self-contends (104wk/300wk sims share the pool)
});
