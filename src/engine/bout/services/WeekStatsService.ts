/**
 * Week Stats Service
 * Accumulates bout statistics for weekly summary
 * Extracted from boutProcessorService.ts to enforce SRP
 */
import type { WeekBoutSummary, BoutImpact } from '@/engine/bout/services/boutProcessorService';

/**
 * Creates a fresh week bout summary
 */
export function createWeekBoutSummary(): WeekBoutSummary {
  return {
    bouts: 0,
    deaths: 0,
    injuries: 0,
    deathRefs: [],
    injuryRefs: [],
    hadPlayerDeath: false,
    hadRivalryEscalation: false,
  };
}

/**
 * Accumulates bout results into week summary
 * Mutates summary for performance (internal accumulator pattern)
 */
export function accumulateWeekStats(summary: WeekBoutSummary, res: BoutImpact): void {
  // Skipped bouts (invalid combatants) have no result — they never happened.
  if (!res.result) return;
  summary.bouts++;
  if (res.stats.death) {
    summary.deaths += res.stats.deathRefs.length;
    summary.deathRefs.push(...res.stats.deathRefs);
  }
  if (res.stats.playerDeath) summary.hadPlayerDeath = true;
  if (res.stats.injured) {
    summary.injuries += res.stats.injuryRefs.length;
    summary.injuryRefs.push(...res.stats.injuryRefs);
  }
}
