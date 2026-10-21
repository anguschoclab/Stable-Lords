import type { GameState } from '@/types/state.types';
import {
  TimeAdvanceService,
  type QuarterAdvanceResult,
  type MonthAdvanceResult,
  type YearAdvanceResult,
  type AdvanceOptions,
} from './timeAdvance';
import { advanceDay, _advanceDayInner } from './dayAdvance';
import { skipToWeekEnd } from './weekSkip';

export { tournamentDaySeed } from './tournamentDay';

/**
 * Stable Lords — Unified Tick Orchestrator
 * Central point for all time-based progression logic.
 * Implementation lives in per-granularity modules: dayAdvance (single day),
 * weekSkip (batched week end), weekTransition (shared weekly boundary),
 * tournamentDay (shared tournament-round resolution), timeAdvance (spans).
 */
export const TickOrchestrator = {
  /**
   * Advances a single day including tournament resolution.
   */
  advanceDay,

  /**
   * Inner day-advance implementation (telemetry is measured by advanceDay).
   */
  _advanceDayInner,

  /**
   * High-performance: Skips to the end of the current week.
   * Batches tournament rounds into a single summary.
   * `opts` are forwarded to the weekly pipeline — the worker entry point
   * passes `mutableInput: true` so worker-owned input is not re-cloned.
   */
  skipToWeekEnd,

  /**
   * Advance a quarter (13 weeks) with progress tracking.
   * Delegates to TimeAdvanceService for batch processing.
   */
  async advanceQuarter(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    return TimeAdvanceService.advanceQuarter(state, opts);
  },

  /**
   * Skip to quarter end (headless mode for UI).
   * Batches 13 weeks with deferred I/O.
   */
  async skipToQuarterEnd(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    return TimeAdvanceService.skipToQuarterEnd(state, opts);
  },

  /**
   * Advance a month (4 weeks) with progress tracking.
   * Delegates to TimeAdvanceService for batch processing.
   */
  async advanceMonth(state: GameState, opts?: AdvanceOptions): Promise<MonthAdvanceResult> {
    return TimeAdvanceService.advanceMonth(state, opts);
  },

  /**
   * Skip to month end (headless mode for UI).
   * Batches 4 weeks with deferred I/O.
   */
  async skipToMonthEnd(state: GameState, opts?: AdvanceOptions): Promise<MonthAdvanceResult> {
    return TimeAdvanceService.skipToMonthEnd(state, opts);
  },

  /**
   * Advance a full year (52 weeks = 4 quarters).
   * Includes year-end Hall of Fame and tier progression.
   */
  async advanceYear(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    return TimeAdvanceService.advanceYear(state, opts);
  },

  /**
   * Skip to year end (headless mode for UI).
   * Batches 52 weeks with deferred I/O.
   */
  async skipToYearEnd(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    return TimeAdvanceService.skipToYearEnd(state, opts);
  },
};
