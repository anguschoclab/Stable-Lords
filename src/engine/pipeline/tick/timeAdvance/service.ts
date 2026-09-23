import type { GameState, DeferredBoutLog } from '@/types/state.types';
import {
  advanceWeek,
  type WeekAdvanceOptions,
} from '@/engine/pipeline/services/weekPipelineService';
import { telemetry, TelemetryEvents, TelemetryTags } from '@/engine/telemetry';
import { truncateState } from '@/engine/storage/truncation';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';
import type { AdvanceOptions, WeekSummary, QuarterAdvanceResult, YearAdvanceResult } from './types';
import { evaluateStopConditions } from './stopConditions';
import { extractWeekSummary, buildQuarterSummary, buildAnnualSummary } from './summaries';

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
    const startTime = performance.now();

    let currentState = state;
    const weekSummaries: WeekSummary[] = [];
    const pendingArchives: DeferredBoutLog[] = [];
    const startTreasury = state.treasury;
    const startWeek = state.week;
    const startYear = state.year;

    const finish = (stopReason: string | null, weeksCompleted: number): QuarterAdvanceResult => {
      // Drain transcripts BEFORE truncation — truncateState caps deferredBoutLogs
      // and would silently drop logs that were never handed to an archive sink.
      pendingArchives.push(...drainDeferredBoutLogs(currentState));
      currentState = truncateState(currentState);

      const duration = performance.now() - startTime;
      const tags = {
        [TelemetryTags.HEADLESS]: String(!!opts?.headless),
        [TelemetryTags.WEEKS_COMPLETED]: String(weeksCompleted),
        ...(stopReason ? { [TelemetryTags.STOP_REASON]: stopReason } : {}),
      };
      telemetry.timing(TelemetryEvents.ADVANCE_QUARTER, duration, tags);
      if (stopReason) {
        telemetry.increment(TelemetryEvents.STOP_CONDITION_TRIGGERED, { reason: stopReason });
      } else {
        telemetry.increment(TelemetryEvents.ADVANCE_QUARTER_SUCCESS, {
          [TelemetryTags.HEADLESS]: String(!!opts?.headless),
        });
      }

      return {
        state: currentState,
        summaries: weekSummaries,
        quarterSummary: buildQuarterSummary(
          currentState,
          startWeek,
          startYear,
          startTreasury,
          weekSummaries
        ),
        stopReason,
        weeksCompleted,
        pendingArchives,
      };
    };

    for (let i = 0; i < 13; i++) {
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
        opts.onProgress(i + 1, 13);
      }
    }

    return finish(null, 13);
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

  async skipToQuarterEnd(
    state: GameState,
    opts?: AdvanceOptions
  ): Promise<QuarterAdvanceResult> {
    return this.advanceQuarter(state, {
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
