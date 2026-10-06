import type { GameState, DeferredBoutLog } from '@/types/state.types';
import {
  advanceWeek,
  type WeekAdvanceOptions,
} from '@/engine/pipeline/services/weekPipelineService';
import { telemetry, TelemetryEvents, TelemetryTags } from '@/engine/core/telemetry';
import { sweepUnfinishedTournaments } from '@/engine/matchmaking/tournamentSelection/resolution';
import { truncateState } from '@/engine/storage/truncation';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';
import type {
  AdvanceOptions,
  WeekSummary,
  QuarterSummary,
  QuarterAdvanceResult,
  MonthAdvanceResult,
  YearAdvanceResult,
} from './types';
import { evaluateStopConditions } from './stopConditions';
import { isSimCancellationRequested } from '@/engine/runtime/cancellation';
import { extractWeekSummary, buildQuarterSummary, buildAnnualSummary } from './summaries';

/** Telemetry event names for a multi-week stride (quarter, month). */
interface SpanEvents {
  timing: string;
  success: string;
}

/**
 * Span teardown: terminal tournament sweep (a batch ending on a tournament
 * week returns with no following week-boundary sweep to finish emitted
 * brackets — runs BEFORE draining so any bouts it resolves still archive),
 * transcript drain BEFORE truncation (truncateState caps deferredBoutLogs
 * and would silently drop logs never handed to an archive sink), then
 * truncate, time, and report.
 */
function finishSpanRun(ctx: {
  state: GameState;
  opts?: AdvanceOptions;
  events: SpanEvents;
  startTime: number;
  startTreasury: number;
  startWeek: number;
  startYear: number;
  weekSummaries: WeekSummary[];
  pendingArchives: DeferredBoutLog[];
  stopReason: string | null;
  weeksCompleted: number;
}): {
  state: GameState;
  result: {
    state: GameState;
    summaries: WeekSummary[];
    spanSummary: QuarterSummary;
    stopReason: string | null;
    weeksCompleted: number;
    pendingArchives: DeferredBoutLog[];
  };
} {
  let currentState = sweepUnfinishedTournaments(ctx.state, ctx.opts?.headless);
  ctx.pendingArchives.push(...drainDeferredBoutLogs(currentState));
  currentState = truncateState(currentState);

  const duration = performance.now() - ctx.startTime;
  const tags = {
    [TelemetryTags.HEADLESS]: String(!!ctx.opts?.headless),
    [TelemetryTags.WEEKS_COMPLETED]: String(ctx.weeksCompleted),
    ...(ctx.stopReason ? { [TelemetryTags.STOP_REASON]: ctx.stopReason } : {}),
  };
  telemetry.timing(ctx.events.timing, duration, tags);
  if (ctx.stopReason) {
    telemetry.increment(TelemetryEvents.STOP_CONDITION_TRIGGERED, { reason: ctx.stopReason });
  } else {
    telemetry.increment(ctx.events.success, {
      [TelemetryTags.HEADLESS]: String(!!ctx.opts?.headless),
    });
  }

  return {
    state: currentState,
    result: {
      state: currentState,
      summaries: ctx.weekSummaries,
      spanSummary: buildQuarterSummary(
        currentState,
        ctx.startWeek,
        ctx.startYear,
        ctx.startTreasury,
        ctx.weekSummaries
      ),
      stopReason: ctx.stopReason,
      weeksCompleted: ctx.weeksCompleted,
      pendingArchives: ctx.pendingArchives,
    },
  };
}

/**
 * Shared multi-week stride: `totalWeeks` sequential canonical week advances
 * with per-week archive drain, per-week stop-condition evaluation, weekly
 * progress callbacks, and cooperative cancellation at week boundaries.
 * advanceQuarter (13 weeks) and advanceMonth (4 weeks) are thin wrappers.
 */
async function advanceSpan(
  state: GameState,
  opts: AdvanceOptions | undefined,
  totalWeeks: number,
  events: SpanEvents
): Promise<{
  state: GameState;
  summaries: WeekSummary[];
  spanSummary: QuarterSummary;
  stopReason: string | null;
  weeksCompleted: number;
  pendingArchives: DeferredBoutLog[];
}> {
  const startTime = performance.now();

  let currentState = state;
  const weekSummaries: WeekSummary[] = [];
  const pendingArchives: DeferredBoutLog[] = [];
  const startTreasury = state.treasury;
  const startWeek = state.week;
  const startYear = state.year;

  const finish = (stopReason: string | null, weeksCompleted: number) => {
    const wrapped = finishSpanRun({
      state: currentState,
      opts,
      events,
      startTime,
      startTreasury,
      startWeek,
      startYear,
      weekSummaries,
      pendingArchives,
      stopReason,
      weeksCompleted,
    });
    currentState = wrapped.state;
    return wrapped.result;
  };

  for (let i = 0; i < totalWeeks; i++) {
    // Cooperative cancellation — cancelSim flips this worker-local flag;
    // exit at the week boundary with the partial state swept and drained.
    if (isSimCancellationRequested()) {
      return finish('cancelled', i);
    }

    const weekOpts: WeekAdvanceOptions = {
      headless: opts?.headless,
      // Week 1 input is caller-owned unless they granted mutableInput;
      // weeks after that run on this service's own returned state.
      mutableInput: i > 0 || opts?.mutableInput === true,
      pool: opts?.pool,
    };
    currentState = await advanceWeek(currentState, weekOpts);

    // Drain transcripts weekly into pendingArchives — bounds memory during
    // the batch and keeps them out of truncateState's deferredBoutLogs cap.
    pendingArchives.push(...drainDeferredBoutLogs(currentState));

    weekSummaries.push(extractWeekSummary(currentState));

    // Stop conditions are evaluated EVERY week — previously they only ran at
    // checkpoint boundaries, letting e.g. a roster wipe on week 1 sim three
    // extra weeks before halting.
    if (opts?.stopConditions) {
      const stopResult = evaluateStopConditions(currentState, opts.stopConditions);
      if (stopResult.shouldStop) {
        return finish(stopResult.reason ?? 'unknown', i + 1);
      }
    }

    if (opts?.onProgress) {
      opts.onProgress(i + 1, totalWeeks);
    }
  }

  return finish(null, totalWeeks);
}

const QUARTER_EVENTS: SpanEvents = {
  timing: TelemetryEvents.ADVANCE_QUARTER,
  success: TelemetryEvents.ADVANCE_QUARTER_SUCCESS,
};

const MONTH_EVENTS: SpanEvents = {
  timing: TelemetryEvents.ADVANCE_MONTH,
  success: TelemetryEvents.ADVANCE_MONTH_SUCCESS,
};

/** Weeks in a month stride. */
const WEEKS_PER_MONTH = 4;
/** Weeks in a quarter stride. */
const WEEKS_PER_QUARTER = 13;

export const TimeAdvanceService = {
  async advanceWeek(state: GameState, opts?: AdvanceOptions): Promise<GameState> {
    const weekOpts: WeekAdvanceOptions = {
      headless: opts?.headless,
      mutableInput: opts?.mutableInput,
      pool: opts?.pool,
    };
    return advanceWeek(state, weekOpts);
  },

  async advanceQuarter(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    const span = await advanceSpan(state, opts, WEEKS_PER_QUARTER, QUARTER_EVENTS);
    return {
      state: span.state,
      summaries: span.summaries,
      quarterSummary: span.spanSummary,
      stopReason: span.stopReason,
      weeksCompleted: span.weeksCompleted,
      pendingArchives: span.pendingArchives,
    };
  },

  /**
   * Advance a month — a 4-week stride on the canonical week pipeline with
   * the same teardown as advanceQuarter (terminal tournament sweep, weekly
   * archive drain, truncation, per-week stop conditions).
   */
  async advanceMonth(state: GameState, opts?: AdvanceOptions): Promise<MonthAdvanceResult> {
    const span = await advanceSpan(state, opts, WEEKS_PER_MONTH, MONTH_EVENTS);
    return {
      state: span.state,
      summaries: span.summaries,
      monthSummary: span.spanSummary,
      stopReason: span.stopReason,
      weeksCompleted: span.weeksCompleted,
      pendingArchives: span.pendingArchives,
    };
  },

  async advanceYear(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    let currentState = state;
    const quarterResults: QuarterAdvanceResult[] = [];
    const pendingArchives: DeferredBoutLog[] = [];
    const startYear = state.year;
    const startTreasury = state.treasury;

    for (let q = 0; q < 4; q++) {
      // Quarters after the first run on this service's own returned state.
      const result = await this.advanceQuarter(currentState, {
        ...opts,
        mutableInput: q > 0 || opts?.mutableInput === true,
      });
      quarterResults.push(result);
      pendingArchives.push(...result.pendingArchives);
      currentState = result.state;

      if (result.stopReason) {
        return {
          state: currentState,
          quarterResults,
          pendingArchives,
          annualSummary: buildAnnualSummary(currentState, startYear, startTreasury, quarterResults),
          stopReason: result.stopReason,
        };
      }
    }

    return {
      state: currentState,
      quarterResults,
      pendingArchives,
      annualSummary: buildAnnualSummary(currentState, startYear, startTreasury, quarterResults),
      stopReason: null,
    };
  },

  async skipToQuarterEnd(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    return this.advanceQuarter(state, {
      ...opts,
      headless: true,
    });
  },

  /**
   * Skip to month end (headless mode for UI).
   * Batches 4 weeks with deferred I/O.
   */
  async skipToMonthEnd(state: GameState, opts?: AdvanceOptions): Promise<MonthAdvanceResult> {
    return this.advanceMonth(state, {
      ...opts,
      headless: true,
    });
  },

  async skipToYearEnd(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    return this.advanceYear(state, {
      ...opts,
      headless: true,
    });
  },
};
