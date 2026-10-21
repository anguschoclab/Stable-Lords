import type { GameState } from '@/types/state.types';
import { SeededRNG } from '@/utils/random';
import type { WeekAdvanceOptions } from '@/engine/pipeline/services/weekPipelineService';
import { resolveTournamentDay } from './tournamentDay';
import { finalizeWeekTransition } from './weekTransition';

/**
 * High-performance: Skips to the end of the current week.
 * Batches tournament rounds into a single summary.
 * `opts` are forwarded to the weekly pipeline — the worker entry point
 * passes `mutableInput: true` so worker-owned input is not re-cloned.
 */
export async function skipToWeekEnd(
  state: GameState,
  opts?: WeekAdvanceOptions
): Promise<GameState> {
  // The pipeline always receives a shallow copy — never the caller's object —
  // which matters when mutableInput grants it in-place mutation rights.
  const { state: drained, weeklyNewsItems } = drainTournamentRounds(
    { ...state },
    state.day || 0
  );
  const withRecap = appendTournamentRecap(drained, state.week, weeklyNewsItems);
  return finalizeWeekTransition(withRecap, opts);
}

/**
 * Resolve the week's remaining tournament rounds headlessly, threading the
 * updated tournament entry through each round instead of re-scanning
 * state.tournaments per day. Returns the accumulated state plus the flat
 * `[Day N]`-prefixed result lines for the recap newsletter.
 */
function drainTournamentRounds(
  state: GameState,
  currentDay: number
): { state: GameState; weeklyNewsItems: string[] } {
  const weeklyNewsItems: string[] = [];
  if (!state.isTournamentWeek || !state.activeTournamentId) {
    return { state, weeklyNewsItems };
  }
  const tournamentId = state.activeTournamentId;
  let currentState = state;
  let tour = (currentState.tournaments || []).find((t) => t.id === tournamentId);
  for (let day = currentDay + 1; day < 7; day++) {
    if (!tour || tour.completed) break;
    const { updatedState, roundResults, isComplete, updatedTournament } = resolveTournamentDay(
      currentState,
      tournamentId,
      day,
      true,
      tour
    );
    currentState = updatedState;
    tour = updatedTournament ?? tour;
    if (roundResults.length > 0) {
      weeklyNewsItems.push(...roundResults.map((r) => `[Day ${day}] ${r}`));
    }
    if (isComplete) break;
  }
  return { state: currentState, weeklyNewsItems };
}

/**
 * Append the single batched recap newsletter for a skipped tournament week.
 * The id is seeded by week — intentionally different from the per-day seeds
 * used by resolveTournamentDay. No-op when no rounds produced items.
 */
function appendTournamentRecap(
  state: GameState,
  week: number,
  weeklyNewsItems: string[]
): GameState {
  if (weeklyNewsItems.length === 0) return state;
  state.newsletter = [
    ...(state.newsletter || []),
    {
      id: new SeededRNG(week).uuid(),
      week,
      title: `Empire News: Tournament Week ${week} Recap`,
      items: weeklyNewsItems,
    },
  ];
  return state;
}
