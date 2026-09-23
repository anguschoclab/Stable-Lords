import type { GameState } from '@/types/state.types';
import { SeededRNGService } from '@/utils/random';
import {
  advanceWeek as runWeeklyPipeline,
  type WeekAdvanceOptions,
} from '@/engine/pipeline/services/weekPipelineService';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import {
  TimeAdvanceService,
  type QuarterAdvanceResult,
  type YearAdvanceResult,
  type AdvanceOptions,
} from './timeAdvance';
import { telemetry, TelemetryEvents } from '@/engine/telemetry';

/**
 * Canonical tournament-day RNG seed. Both the interactive day tick
 * (advanceDay) and the batched skip (skipToWeekEnd) MUST use this — they
 * previously diverged (week*100+day vs year*10000+week*100+day), producing
 * different tournament outcomes for identical game days.
 */
export function tournamentDaySeed(year: number, week: number, day: number): number {
  return year * 10000 + week * 100 + day;
}

/**
 * Resolve a single tournament day. Shared by advanceDay (single step) and
 * skipToWeekEnd (batched loop) so the two paths can never drift apart —
 * same seed formula, same tournament-entry threading, same headless flag.
 */
function resolveTournamentDay(
  state: GameState,
  tournamentId: string,
  day: number,
  headless: boolean | undefined,
  tournament?: GameState['tournaments'][number]
) {
  return TournamentSelectionService.resolveRound(
    state,
    tournamentId,
    tournamentDaySeed(state.year, state.week, day),
    headless,
    tournament
  );
}

/**
 * Stable Lords — Unified Tick Orchestrator
 * Central point for all time-based progression logic.
 */
export const TickOrchestrator = {
  /**
   * Advances a single day including tournament resolution.
   */
  async advanceDay(state: GameState, opts?: WeekAdvanceOptions): Promise<GameState> {
    const dayStarted = performance.now();
    const result = await TickOrchestrator._advanceDayInner(state, opts);
    telemetry.timing(TelemetryEvents.ADVANCE_DAY, performance.now() - dayStarted, {
      tournament: String(Boolean(state.isTournamentWeek)),
    });
    return result;
  },

  /**
   * Inner day-advance implementation (telemetry is measured by advanceDay).
   */
  async _advanceDayInner(state: GameState, opts?: WeekAdvanceOptions): Promise<GameState> {
    const currentDay = state.day || 0;
    const nextDay = currentDay + 1;
    // Standardize seed generation
    const seed = tournamentDaySeed(state.year, state.week, nextDay);
    const rng = new SeededRNGService(seed);

    // 1. Weekly Transition (Day 7)
    if (nextDay >= 7) {
      // Correct for 52-week year wrap-around logic moved to SystemPass
      const finalState = await runWeeklyPipeline(state, { mutableInput: opts?.mutableInput });
      return {
        ...finalState,
        day: 0,
        isTournamentWeek: false,
        activeTournamentId: undefined,
      };
    }

    // 2. Tournament Day (Skip to End Mode not active)
    if (state.isTournamentWeek && state.activeTournamentId) {
      const tour = (state.tournaments || []).find((t) => t.id === state.activeTournamentId);
      const { updatedState, roundResults } = resolveTournamentDay(
        state,
        state.activeTournamentId,
        nextDay,
        opts?.headless,
        tour
      );

      const nextState = { ...updatedState, day: nextDay };

      if (roundResults.length > 0) {
        nextState.newsletter = [
          ...(nextState.newsletter || []),
          {
            id: rng.uuid(),
            week: state.week,
            title: `Empire Day ${nextDay}: Tournament Results`,
            items: roundResults,
          },
        ];
      }
      return nextState;
    }

    // 3. Regular Day
    return { ...state, day: nextDay };
  },

  /**
   * High-performance: Skips to the end of the current week.
   * Batches tournament rounds into a single summary.
   */
  async skipToWeekEnd(state: GameState): Promise<GameState> {
    let currentState = { ...state };
    const currentDay = state.day || 0;
    const weeklyNewsItems: string[] = [];

    // 1. Resolve Tournament Rounds (Batched)
    if (state.isTournamentWeek && state.activeTournamentId) {
      const tournamentId = state.activeTournamentId;
      // Locate the tournament once and thread the updated entry through each
      // round instead of re-scanning state.tournaments per day.
      let tour = (currentState.tournaments || []).find((t) => t.id === tournamentId);
      for (let day = currentDay + 1; day < 7; day++) {
        if (!tour || tour.completed) break;
        const { updatedState, roundResults, isComplete, updatedTournament } =
          resolveTournamentDay(currentState, tournamentId, day, true, tour);
        currentState = updatedState;
        tour = updatedTournament ?? tour;
        if (roundResults.length > 0) {
          weeklyNewsItems.push(...roundResults.map((r) => `[Day ${day}] ${r}`));
        }
        if (isComplete) break;
      }
    }

    // 2. Collect Batched Summary (Already done by resolving rounds sequentially in a loop)
    // Add the batched newsletter item
    if (weeklyNewsItems.length > 0) {
      currentState.newsletter = [
        ...(currentState.newsletter || []),
        {
          id: new SeededRNGService(state.week).uuid(),
          week: state.week,
          title: `Empire News: Tournament Week ${state.week} Recap`,
          items: weeklyNewsItems,
        },
      ];
    }

    // 3. Run final weekly pipeline
    const finalState = await runWeeklyPipeline(currentState);
    return {
      ...finalState,
      day: 0,
      isTournamentWeek: false,
      activeTournamentId: undefined,
    };
  },

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
