import type { GameState, TournamentEntry } from '@/types/state.types';
import type { TournamentId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/** Class-bracket emission output: emitted entries + the active bracket id. */
export interface ClassEmissionResult {
  tournaments: TournamentEntry[];
  activeTournamentId?: TournamentId;
}

/**
 * Class-bracket emission — V27 stub (Phase 1 RED-first scaffolding).
 * The real implementation builds one bracket per populated FE class from
 * the frozen tournamentCycle (invited ∪ declared − scratched), pads short
 * fields with class-scaled freelancers, and picks the active bracket.
 */
export function emitClassTournaments(
  _state: GameState,
  _nextWeek: number,
  _rng: IRNGService
): ClassEmissionResult {
  return { tournaments: [], activeTournamentId: undefined };
}
