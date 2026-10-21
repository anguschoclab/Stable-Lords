import type { GameState } from '@/types/state.types';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';

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
export function resolveTournamentDay(
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
