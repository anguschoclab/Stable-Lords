import type { GameState } from '@/types/state.types';
import type { WeekSummary, QuarterSummary, QuarterAdvanceResult, YearAdvanceResult } from './types';

/**
 *
 */
export function extractWeekSummary(state: GameState): WeekSummary {
  // Read from lastSimulationReport instead of scanning arenaHistory (O(1) vs O(n))
  const report = state.lastSimulationReport;
  const bouts = report?.bouts?.length || 0;
  const deaths = report?.bouts?.filter((b) => b.by === 'Kill').length || 0;

  return {
    week: state.week,
    year: state.year,
    treasury: state.treasury,
    rosterSize: state.roster.length,
    bouts,
    deaths,
  };
}

/**
 *
 */
export function buildQuarterSummary(
  state: GameState,
  startWeek: number,
  startYear: number,
  startTreasury: number,
  weekSummaries: WeekSummary[]
): QuarterSummary {
  return {
    startWeek,
    endWeek: state.week,
    startYear,
    endYear: state.year,
    treasuryDelta: state.treasury - startTreasury,
    weekSummaries,
  };
}

/**
 *
 */
export function buildAnnualSummary(
  state: GameState,
  startYear: number,
  startTreasury: number,
  quarterResults: QuarterAdvanceResult[]
): YearAdvanceResult['annualSummary'] {
  return {
    startYear,
    endYear: state.year,
    treasuryDelta: state.treasury - startTreasury,
    totalBouts: quarterResults.reduce(
      (sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.bouts, 0),
      0
    ),
    totalDeaths: quarterResults.reduce(
      (sum, r) => sum + r.quarterSummary.weekSummaries.reduce((s, w) => s + w.deaths, 0),
      0
    ),
  };
}
