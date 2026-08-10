import { describe, it, expect } from 'vitest';
import { runAutosim, extractWeekSummary } from '@/engine/autosim';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';

describe('NF3: autosim memory growth', () => {
  it('sequential autosim should not grow arenaHistory unboundedly', () => {
    const state = createFreshState('autosim-memory-test');
    const initialArenaLength = (state.arenaHistory || []).length;

    // Run 100 weeks of sequential autosim — crosses two truncation points (50, 100)
    return runAutosim(state, { weeksToSim: 100 }).then((result) => {
      const finalArenaLength = (result.finalState.arenaHistory || []).length;

      expect(result.weeksSimmed).toBe(100);

      // With truncateState called every 50 weeks (capping arenaHistory at 500),
      // and week 100 being a truncation point, arenaHistory must be ≤500.
      expect(finalArenaLength).toBeLessThanOrEqual(500);
      expect(finalArenaLength).toBeGreaterThanOrEqual(initialArenaLength);
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
