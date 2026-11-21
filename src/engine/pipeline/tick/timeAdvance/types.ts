import type { GameState } from '@/types/state.types';

/** A soft-stop check an autosim span evaluates each week. */
export type SoftStopCondition =
  | { type: 'rosterEmpty' }
  | { type: 'playerDeath' }
  | { type: 'noPairings' }
  | { type: 'custom'; check: (state: GameState) => boolean };

/** Stops applied when the caller doesn't supply its own list. */
export const DEFAULT_AUTOSIM_STOPS: SoftStopCondition[] = [
  { type: 'rosterEmpty' },
  { type: 'playerDeath' },
  { type: 'noPairings' },
];

/** Options shared by advanceWeek/Month/Quarter/Year spans. */
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
  /**
   * In-process shard pool for parallelizable passes. IN-PROCESS ONLY — never
   * send this across a worker boundary (it is not structured-cloneable). In
   * worker contexts, configure the shared pool via `configureEnginePool`.
   */
  pool?: import('@/engine/pool/enginePool').EnginePool;
}

/** Per-week counters collected during a span advance. */
export interface WeekSummary {
  week: number;
  year: number;
  treasury: number;
  rosterSize: number;
  bouts: number;
  deaths: number;
}

/** Aggregated 13-week span summary. */
export interface QuarterSummary {
  startWeek: number;
  endWeek: number;
  startYear: number;
  endYear: number;
  treasuryDelta: number;
  weekSummaries: WeekSummary[];
}

/** Result of advancing one quarter — state, summaries, stop reason. */
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
 * A month is a 4-week stride — the span summary has the same shape as a
 * quarter's (bounded by different week counts, not different fields).
 */
export type MonthSummary = QuarterSummary;

/** Result of advancing one 4-week month. */
export interface MonthAdvanceResult {
  state: GameState;
  summaries: WeekSummary[];
  monthSummary: MonthSummary;
  stopReason: string | null;
  weeksCompleted: number;
  /** Same drain contract as QuarterAdvanceResult — caller owns archival. */
  pendingArchives: import('@/types/state.types').DeferredBoutLog[];
}

/** Result of advancing a full year — four quarter results plus annual summary. */
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
