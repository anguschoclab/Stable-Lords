/**
 * WeekStatsService — week summary accumulation with warrior refs.
 */
import { describe, it, expect } from 'vitest';
import {
  createWeekBoutSummary,
  accumulateWeekStats,
} from '@/engine/bout/services/WeekStatsService';
import type { BoutImpact } from '@/engine/bout/services/boutProcessorService';

const impact = (over: Partial<BoutImpact['stats']>): BoutImpact =>
  ({
    result: {},
    stats: {
      death: false,
      playerDeath: false,
      injured: false,
      deathRefs: [],
      injuryRefs: [],
      ...over,
    },
  }) as BoutImpact;

describe('WeekStatsService', () => {
  it('accumulates death refs and counts them', () => {
    const summary = createWeekBoutSummary();
    accumulateWeekStats(
      summary,
      impact({ death: true, playerDeath: true, deathRefs: [{ id: 'w1', name: 'A' }] })
    );

    expect(summary.bouts).toBe(1);
    expect(summary.deaths).toBe(1);
    expect(summary.deathRefs).toEqual([{ id: 'w1', name: 'A' }]);
    expect(summary.hadPlayerDeath).toBe(true);
  });

  it('accumulates injury refs and counts them', () => {
    const summary = createWeekBoutSummary();
    accumulateWeekStats(
      summary,
      impact({
        injured: true,
        injuryRefs: [
          { id: 'w1', name: 'A' },
          { id: 'w2', name: 'B' },
        ],
      })
    );

    expect(summary.injuries).toBe(2);
    expect(summary.injuryRefs).toEqual([
      { id: 'w1', name: 'A' },
      { id: 'w2', name: 'B' },
    ]);
  });

  it('skips voided bouts with no result', () => {
    const summary = createWeekBoutSummary();
    accumulateWeekStats(summary, { result: null, stats: {} } as unknown as BoutImpact);
    expect(summary.bouts).toBe(0);
  });
});
