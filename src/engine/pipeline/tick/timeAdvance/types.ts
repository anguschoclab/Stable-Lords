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
  stopConditions?: SoftStopCondition[];
  onProgress?: (weeksCompleted: number, totalWeeks: number) => void;
  /**
   * Caller exclusively owns `state` — the pipeline may mutate it in place
   * instead of cloning at the first week boundary. Set by worker entry
   * points and by advanceYear for quarters after the first.
   */
  mutableInput?: boolean;
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
  /**
   * Bout transcripts drained before truncation. The service never performs
   * I/O — the caller's environment must hand these to the archive sink.
   */
  pendingArchives: import('@/types/state.types').DeferredBoutLog[];
}

/**
 *
 */
export interface YearAdvanceResult {
  state: GameState;
  quarterResults: QuarterAdvanceResult[];
  /** All bout transcripts drained across the four quarters. */
  pendingArchives: import('@/types/state.types').DeferredBoutLog[];
  annualSummary: {
    startYear: number;
    endYear: number;
    treasuryDelta: number;
    totalBouts: number;
    totalDeaths: number;
  };
  stopReason: string | null;
}
