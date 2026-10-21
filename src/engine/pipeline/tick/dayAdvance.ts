import type { GameState } from '@/types/state.types';
import { SeededRNG } from '@/utils/random';
import type { WeekAdvanceOptions } from '@/engine/pipeline/services/weekPipelineService';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';
import { resolveTournamentDay, tournamentDaySeed } from './tournamentDay';
import { finalizeWeekTransition } from './weekTransition';

/**
 * Advances a single day including tournament resolution.
 */
export async function advanceDay(state: GameState, opts?: WeekAdvanceOptions): Promise<GameState> {
  const dayStarted = performance.now();
  const result = await _advanceDayInner(state, opts);
  telemetry.timing(TelemetryEvents.ADVANCE_DAY, performance.now() - dayStarted, {
    tournament: String(Boolean(state.isTournamentWeek)),
  });
  return result;
}

/**
 * Inner day-advance implementation (telemetry is measured by advanceDay).
 */
export async function _advanceDayInner(
  state: GameState,
  opts?: WeekAdvanceOptions
): Promise<GameState> {
  const nextDay = (state.day || 0) + 1;

  // 1. Weekly Transition (Day 7)
  if (nextDay >= 7) return finalizeWeekTransition(state, opts);

  // 2. Tournament Day (Skip to End Mode not active)
  if (state.isTournamentWeek && state.activeTournamentId) {
    return advanceTournamentDay(state, state.activeTournamentId, nextDay, opts?.headless);
  }

  // 3. Regular Day
  return { ...state, day: nextDay };
}

/**
 * Single interactive tournament day: resolve one round through the shared
 * helper, advance the day counter, and append a results newsletter keyed
 * on the same tournament-day seed.
 */
function advanceTournamentDay(
  state: GameState,
  tournamentId: string,
  nextDay: number,
  headless: boolean | undefined
): GameState {
  // Standardize seed generation
  const rng = new SeededRNG(tournamentDaySeed(state.year, state.week, nextDay));
  const tour = (state.tournaments || []).find((t) => t.id === tournamentId);
  const { updatedState, roundResults } = resolveTournamentDay(
    state,
    tournamentId,
    nextDay,
    headless,
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
