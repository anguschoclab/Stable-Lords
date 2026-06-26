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
  const valueMap = new Map<(typeof value)[0]['id'], (typeof value)[0]>();
  for (const v of value) {
    if (!valueMap.has(v.id)) valueMap.set(v.id, v);
  }
  const existingIds = new Set(existing.map((e) => e.id));
  const updated = existing.map((t) => valueMap.get(t.id) ?? t);
  const newTournaments = value.filter((v) => !existingIds.has(v.id));
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
