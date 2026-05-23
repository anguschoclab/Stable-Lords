/**
 * Tournaments Domain Impacts
 * Handles tournament entries, tournament week flag, and active tournament ID.
 */
import type { GameState, TournamentEntry } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';

/**
 * Apply tournaments to state.
 */
export const tournaments = (state: GameState, value: TournamentEntry[]) => {
  if (!value || value.length === 0) return;
  const existing = state.tournaments || [];
  const updated = existing.map((t) => {
    const replacement = value.find((v) => v.id === t.id);
    return replacement ? replacement : t;
  });
  // Add any new tournaments that weren't in the existing array
  const newTournaments = value.filter((v) => !existing.find((e) => e.id === v.id));
  state.tournaments = [...updated, ...newTournaments];
};

/**
 * Apply tournament week flag to state.
 */
export const isTournamentWeek = (state: GameState, value: boolean) => {
  state.isTournamentWeek = value;
};

/**
 * Apply active tournament ID to state.
 */
export const activeTournamentId = (state: GameState, value: TournamentId) => {
  state.activeTournamentId = value;
};

/**
 * Tournaments impact handlers map.
 */
export const tournamentsHandlers = {
  tournaments,
  isTournamentWeek,
  activeTournamentId,
};
