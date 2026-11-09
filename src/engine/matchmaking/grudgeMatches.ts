import type { BoutOffer, GameState } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';

/**
 * Grudge matches — V27 stub (Phase 1 RED-first scaffolding).
 * Post-tournament exhibition bouts: one grudge offer per warrior, drawn from
 * the same class's participant pool, resolving as an ordinary arena bout
 * (+1 FE) in the week after the tournament completes.
 */
export function buildGrudgeOffers(
  _state: GameState,
  _tournamentId: TournamentId
): BoutOffer[] {
  return [];
}
