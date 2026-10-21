/**
 * Warrior Lookup Utilities
 * Centralized warrior finding with caching to eliminate DRY violations
 * Consolidated from tournamentSelection/utils.ts and tournament/tournamentStateMutator.ts
 *
 * The roster index is no longer private to this module — it delegates to
 * `entityIndex.livingWarriorById`, the single canonical warrior index shared
 * with search/history resolution. The tournament overlay and dead-registry
 * filtering below are unchanged.
 */
import type { GameState, TournamentEntry, Warrior } from '@/types/state.types';
import { isDead, deadIdSet } from '@/engine/warrior/warriorStatus';
import { ensureEntityIndex, clearEntityIndexCaches } from '@/engine/core/entityIndex';

/**
 * Clears the warrior cache to prevent state pollution across tests.
 * This should be called in test cleanup hooks.
 */
export function clearWarriorCache(): void {
  clearEntityIndexCaches();
}

/**
 * Find warrior by id across player roster, rival rosters, and tournament participants.
 * Uses the shared entity index for O(1) lookups after first call per state.
 *
 * @param state - Game state
 * @param warriorId - Warrior id to find
 * @param tournament - Optional tournament to check participants
 * @returns The warrior if found, undefined otherwise
 */
export function findWarriorById(
  state: GameState,
  warriorId: string,
  tournament?: TournamentEntry
): Warrior | undefined {
  // Check tournament first if provided (optimized order from tournamentStateMutator.ts)
  if (tournament) {
    const deadIds = deadIdSet(state);
    for (const participant of tournament.participants) {
      // A dead-stamped or registry-listed snapshot never resolves — fall
      // through to a live roster entry of the same id if one exists.
      if (
        participant.id === warriorId &&
        participant.attributes &&
        !isDead(participant) &&
        !deadIds.has(participant.id)
      ) {
        return participant;
      }
    }
  }

  return ensureEntityIndex(state).livingWarriorById.get(warriorId);
}
