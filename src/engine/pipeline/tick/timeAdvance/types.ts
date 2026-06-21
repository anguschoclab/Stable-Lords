import type { GameState } from '@/types/state.types';

/**
 *
 */
export type SoftStopCondition =
  | { type: 'rosterEmpty' }
  | { type: 'playerDeath' }
  | { type: 'noPairings' }
  | { type: 'custom'; check: (state: GameState) => boolean };

export const DEFAULT_AUTOSIM_STOPS: SoftStopCondition[] = [
  { type: 'rosterEmpty' },
  { type: 'playerDeath' },
  { type: 'noPairings' },
];

/**
 *
 */
export interface AdvanceOptions {
  headless?: boolean;
  checkpointInterval?: number;
  stopConditions?: SoftStopCondition[];
  onProgress?: (weeksCompleted: number, totalWeeks: number) => void;
}

/**
 *
 */
export interface WeekSummary {
  week: number;
  year: number;
  treasury: number;
  rosterSize: number;
  bouts: number;
  deaths: number;
}

/**
 *
 */
export interface QuarterSummary {
  startWeek: number;
  endWeek: number;
  startYear: number;
  endYear: number;
  treasuryDelta: number;
  weekSummaries: WeekSummary[];
}

/**
 *
 */
export interface QuarterAdvanceResult {
  state: GameState;
  summaries: WeekSummary[];
  quarterSummary: QuarterSummary;
  stopReason: string | null;
  weeksCompleted: number;
}

/**
 *
 */
export interface YearAdvanceResult {
  state: GameState;
  quarterResults: QuarterAdvanceResult[];
  annualSummary: {
    startYear: number;
    endYear: number;
    treasuryDelta: number;
    totalBouts: number;
    totalDeaths: number;
  };
  stopReason: string | null;
}
