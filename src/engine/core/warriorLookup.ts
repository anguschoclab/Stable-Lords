/**
 * Warrior Lookup Utilities
 * Centralized warrior finding with caching to eliminate DRY violations
 * Consolidated from tournamentSelection/utils.ts and tournament/tournamentStateMutator.ts
 */
import type { GameState, TournamentEntry, Warrior } from '@/types/state.types';
import { isDead, deadIdSet } from '@/engine/warrior/warriorStatus';

let warriorCache = new WeakMap<GameState, Map<string, Warrior>>();

/**
 * Clears the warrior cache to prevent state pollution across tests.
 * This should be called in test cleanup hooks.
 */
export function clearWarriorCache(): void {
  warriorCache = new WeakMap<GameState, Map<string, Warrior>>();
}

/**
 * Find warrior by id across player roster, rival rosters, and tournament participants.
 * Uses WeakMap caching for O(1) lookups after first call per state.
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

  // Check cached warrior map
  let map = warriorCache.get(state);
  if (!map) {
    map = new Map<string, Warrior>();

    // Index player roster
    for (const warrior of state.roster) {
      map.set(warrior.id, warrior);
    }

    // Index rival rosters
    for (const rival of state.rivals || []) {
      for (const warrior of rival.roster) {
        map.set(warrior.id, warrior);
      }
    }

    warriorCache.set(state, map);
  }

  return map.get(warriorId);
}
