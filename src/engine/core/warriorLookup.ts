/**
 * Warrior Lookup Utilities
 * Centralized warrior finding with caching to eliminate DRY violations
 * Consolidated from tournamentSelection/utils.ts and tournament/tournamentStateMutator.ts
 */
import type { GameState, TournamentEntry, Warrior } from '@/types/state.types';

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
    for (const participant of tournament.participants) {
      if (participant.id === warriorId && participant.attributes) {
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
