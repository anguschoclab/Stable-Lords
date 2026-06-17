import type { GameState } from '@/types/state.types';
import {
  advanceWeek,
  type WeekAdvanceOptions,
} from '@/engine/pipeline/services/weekPipelineService';
import { flushDeferredArchivesOffThread } from '@/engine/pipeline/adapters/opfsArchiver';
import { telemetry, TelemetryEvents, TelemetryTags } from '@/engine/telemetry';
import { truncateState } from '@/engine/storage/truncation';
import type {
  AdvanceOptions,
  WeekSummary,
  QuarterAdvanceResult,
  YearAdvanceResult,
} from './types';
import { evaluateStopConditions } from './stopConditions';
import { extractWeekSummary, buildQuarterSummary, buildAnnualSummary } from './summaries';

export const TimeAdvanceService = {
  advanceWeek(state: GameState, opts?: AdvanceOptions): GameState {
    const weekOpts: WeekAdvanceOptions = {
      headless: opts?.headless,
      deferArchives: opts?.deferArchives,
    };
    return advanceWeek(state, weekOpts);
  },

  async advanceQuarter(state: GameState, opts?: AdvanceOptions): Promise<QuarterAdvanceResult> {
    const startTime = performance.now();

    let currentState = state;
    const weekSummaries: WeekSummary[] = [];
    const startTreasury = state.treasury;
    const startWeek = state.week;
    const startYear = state.year;

    const checkpointInterval = opts?.checkpointInterval ?? 4;

    for (let i = 0; i < 13; i++) {
      const weekOpts: WeekAdvanceOptions = {
        headless: opts?.headless,
        deferArchives: opts?.deferArchives,
      };
      currentState = advanceWeek(currentState, weekOpts);

      weekSummaries.push(extractWeekSummary(currentState));

      if (opts?.stopConditions && (i + 1) % checkpointInterval === 0) {
        const stopResult = evaluateStopConditions(currentState, opts.stopConditions);
        if (stopResult.shouldStop) {
          if (opts.deferArchives) {
            flushDeferredArchivesOffThread(currentState);
          }
          currentState = truncateState(currentState);

          const duration = performance.now() - startTime;
          telemetry.timing(TelemetryEvents.ADVANCE_QUARTER, duration, {
            [TelemetryTags.HEADLESS]: String(!!opts?.headless),
            [TelemetryTags.STOP_REASON]: stopResult.reason ?? 'unknown',
            [TelemetryTags.WEEKS_COMPLETED]: String(i + 1),
          });
          telemetry.increment(TelemetryEvents.STOP_CONDITION_TRIGGERED, {
            reason: stopResult.reason ?? 'unknown',
          });

          return {
            state: currentState,
            summaries: weekSummaries,
            quarterSummary: buildQuarterSummary(currentState, startWeek, startYear, startTreasury, weekSummaries),
            stopReason: stopResult.reason ?? 'unknown',
            weeksCompleted: i + 1,
          };
        }
      }

      if (opts?.onProgress) {
        opts.onProgress(i + 1, 13);
      }
    }

    if (opts?.deferArchives) {
      flushDeferredArchivesOffThread(currentState);
    }

    currentState = truncateState(currentState);

    const duration = performance.now() - startTime;
    telemetry.timing(TelemetryEvents.ADVANCE_QUARTER, duration, {
      [TelemetryTags.HEADLESS]: String(!!opts?.headless),
      [TelemetryTags.WEEKS_COMPLETED]: '13',
    });
    telemetry.increment(TelemetryEvents.ADVANCE_QUARTER_SUCCESS, {
      [TelemetryTags.HEADLESS]: String(!!opts?.headless),
    });

    return {
      state: currentState,
      summaries: weekSummaries,
      quarterSummary: buildQuarterSummary(currentState, startWeek, startYear, startTreasury, weekSummaries),
      stopReason: null,
      weeksCompleted: 13,
    };
  },

  async advanceYear(state: GameState, opts?: AdvanceOptions): Promise<YearAdvanceResult> {
    let currentState = state;
    const quarterResults: QuarterAdvanceResult[] = [];
    const startYear = state.year;
    const startTreasury = state.treasury;

    for (let q = 0; q < 4; q++) {
      const result = await this.advanceQuarter(currentState, opts);
      quarterResults.push(result);
      currentState = result.state;

      if (result.stopReason) {
        return {
          state: currentState,
          quarterResults,
          annualSummary: buildAnnualSummary(currentState, startYear, startTreasury, quarterResults),
          stopReason: result.stopReason,
        };
      }
    }

    return {
      state: currentState,
      quarterResults,
      annualSummary: buildAnnualSummary(currentState, startYear, startTreasury, quarterResults),
      stopReason: null,
    };
  },

  async skipToQuarterEnd(
    state: GameState,
    opts?: Omit<AdvanceOptions, 'checkpointInterval'>
  ): Promise<QuarterAdvanceResult> {
    return this.advanceQuarter(state, {
      ...opts,
      headless: true,
      deferArchives: true,
    });
  },

  async skipToYearEnd(
    state: GameState,
    opts?: Omit<AdvanceOptions, 'checkpointInterval'>
  ): Promise<YearAdvanceResult> {
    return this.advanceYear(state, {
      ...opts,
      headless: true,
      deferArchives: true,
    });
  },
};
