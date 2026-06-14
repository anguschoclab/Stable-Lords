import type { GameState } from '@/types/state.types';
import type { WeekSummary, QuarterSummary, QuarterAdvanceResult, YearAdvanceResult } from './types';

export function extractWeekSummary(state: GameState): WeekSummary {
  const { bouts, deaths } = (state.arenaHistory || []).reduce(
    (acc, f) => {
      if (f.week === state.week) {
        acc.bouts++;
        if (f.by === 'Kill') acc.deaths++;
      }
      return acc;
    },
    { bouts: 0, deaths: 0 }
  );

  return {
    week: state.week,
    year: state.year,
    treasury: state.treasury,
    rosterSize: state.roster.length,
    bouts,
    deaths,
  };
}

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
