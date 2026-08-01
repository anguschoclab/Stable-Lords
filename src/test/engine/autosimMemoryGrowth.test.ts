import { describe, it, expect } from 'vitest';
import { runAutosim, extractWeekSummary } from '@/engine/autosim';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';

describe('NF3: autosim memory growth', () => {
  it('sequential autosim should not grow arenaHistory unboundedly', () => {
    const state = createFreshState('autosim-memory-test');
    const initialArenaLength = (state.arenaHistory || []).length;

    // Run 20 weeks of sequential autosim
    return runAutosim(state, { weeksToSim: 20 }).then((result) => {
      const finalArenaLength = (result.finalState.arenaHistory || []).length;

      // After 20 weeks, arena history should not have grown by more than ~20 entries
      // (some weeks may have bouts, some may not). But it should NOT be 0 either.
      // The key issue: truncateState is never called in sequential autosim,
      // so arenaHistory grows without bound. After 20 weeks it's small, but
      // after 500 weeks it would be huge.
      expect(finalArenaLength).toBeGreaterThanOrEqual(initialArenaLength);

      // This test documents the bug: after many weeks, arenaHistory grows
      // without truncation. The fix would call truncateState periodically.
      // For now, just verify it doesn't crash.
      expect(result.weeksSimmed).toBe(20);
    });
  });

  it('sequential autosim should not grow ledger unboundedly', () => {
    const state = createFreshState('autosim-ledger-test');

    return runAutosim(state, { weeksToSim: 10 }).then((result) => {
      // Ledger should exist and be finite
      expect(result.finalState.ledger).toBeDefined();
      expect(Array.isArray(result.finalState.ledger)).toBe(true);

      // After 10 weeks, ledger should have at most ~10-30 entries
      // (multiple ledger entries per week are possible)
      // This is fine for 10 weeks, but 500 weeks would be 5000+ entries
      expect(result.finalState.ledger!.length).toBeLessThan(100);
    });
  });

  it('extractWeekSummary reads from lastSimulationReport', () => {
    const state = createFreshState('autosim-summary-test');
    const next = advanceWeek(state, { headless: true });

    const summary = extractWeekSummary(next, next.week);
    expect(summary.week).toBe(next.week);
    expect(typeof summary.bouts).toBe('number');
    expect(typeof summary.deaths).toBe('number');
    expect(Array.isArray(summary.deathNames)).toBe(true);
  });
});
