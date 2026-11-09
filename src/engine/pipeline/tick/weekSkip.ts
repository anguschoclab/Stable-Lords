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
  if (!state.isTournamentWeek) {
    return { state, weeklyNewsItems };
  }
  let currentState = state;
  // Day-outer / bracket-inner — MUST mirror advanceTournamentDay's order so
  // a skip produces the same seeded outcomes as day-by-day play. Each
  // bracket's updated entry is threaded through its own next-day call so
  // resolution sees the freshest bracket (and stops once completed).
  const threaded = new Map<string, GameState['tournaments'][number]>();
  for (let day = currentDay + 1; day < 7; day++) {
    const pending = (currentState.tournaments || []).filter((t) => !t.completed);
    if (pending.length === 0) break;
    for (const [i, bracket] of pending.entries()) {
      const entry = threaded.get(bracket.id) ?? bracket;
      if (entry.completed) continue;
      const { updatedState, roundResults, isComplete, updatedTournament } = resolveTournamentDay({
        state: currentState,
        tournamentId: entry.id,
        day,
        headless: true,
        tournament: entry,
        seedOffset: i * 16,
      });
      currentState = updatedState;
      if (updatedTournament) threaded.set(entry.id, updatedTournament);
      if (roundResults.length > 0) {
        weeklyNewsItems.push(...roundResults.map((r) => `[Day ${day}] ${r}`));
      }
      if (isComplete) {
        threaded.set(entry.id, { ...(updatedTournament ?? entry), completed: true });
      }
    }
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
