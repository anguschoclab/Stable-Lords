import { describe, it, expect } from 'vitest';
import { processPlayerOffers, extractWeekSummary } from '@/engine/autosim';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';

describe('autosimOfferProcessing', () => {
  it('processPlayerOffers uses warriorToOfferIds index when available', () => {
    let state = createFreshState('autosim-offer-index-test');
    state = advanceWeek(state, { headless: true });

    // After advanceWeek, warriorToOfferIds should be built
    expect(state.warriorToOfferIds).toBeDefined();

    // processPlayerOffers should use the index (not scan)
    const result = processPlayerOffers(state);
    expect(result).toBeDefined();
  });

  it('processPlayerOffers falls back to scan when index is missing', () => {
    let state = createFreshState('autosim-offer-scan-test');
    state = advanceWeek(state, { headless: true });

    // Remove the index to force scan fallback
    state.warriorToOfferIds = undefined;

    // Should not crash
    const result = processPlayerOffers(state);
    expect(result).toBeDefined();
  });

  it('extractWeekSummary handles missing lastSimulationReport gracefully', () => {
    const state = createFreshState('autosim-summary-missing-test');
    state.lastSimulationReport = undefined;

    const summary = extractWeekSummary(state, 1);
    expect(summary.bouts).toBe(0);
    expect(summary.deaths).toBe(0);
    expect(summary.deathNames).toEqual([]);
  });

  it('extractWeekSummary correctly counts kills from lastSimulationReport', () => {
    const state = createFreshState('autosim-summary-kills-test');
    state.lastSimulationReport = {
      id: 'test-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [
        { title: 'Alice vs Bob', winner: 'A', by: 'Kill' } as any,
        { title: 'Charlie vs Dave', winner: 'A', by: 'Decision' } as any,
      ],
    } as any;

    const summary = extractWeekSummary(state, 1);
    expect(summary.bouts).toBe(2);
    expect(summary.deaths).toBe(1);
    expect(summary.deathNames).toContain('Bob');
  });
});
