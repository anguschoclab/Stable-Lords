import { GameState, Warrior } from '@/types/state.types';
import {
  ensureEntityIndex,
  clearEntityIndexCaches,
  type EntityIndexState,
} from '@/engine/core/entityIndex';

// Minimal types for history resolution — avoids importing full RivalStableData
/**
 * Warrior minimal type.
 */
type WarriorMinimal = Pick<Warrior, 'id' | 'name'>;

/**
 * Rival shallow type.
 */
type RivalShallow = {
  id: string;
  owner: { stableName: string };
  roster?: WarriorMinimal[];
};

/**
 * Defines the shape of name resolution state.
 */
export interface NameResolutionState {
  player: { id: string; stableName: string; name: string };
  rivals: RivalShallow[];
  roster: WarriorMinimal[];
  graveyard: WarriorMinimal[];
  retired: WarriorMinimal[];
}

/**
 * Clears all history resolver caches to prevent state pollution across tests.
 * This should be called in test cleanup hooks.
 */
export function clearHistoryResolverCaches(): void {
  clearEntityIndexCaches();
}

/**
 * Resolves a warrior's current display name from their persistent ID.
 * Falls back to the provided legacy name if the ID lookup fails.
 *
 * @param state - The name resolution state
 * @param warriorId - The persistent ID of the warrior
 * @param legacyName - Fallback name if ID is not found
 * @returns The resolved name or legacy fallback
 */
export function resolveWarriorName(
  state: NameResolutionState,
  warriorId: string | undefined,
  legacyName: string
): string {
  if (!warriorId) return legacyName;

  const w = ensureEntityIndex(state as EntityIndexState).warriorById.get(warriorId);
  return w ? w.name : legacyName;
}

/**
 * Resolves a stable's current display name from its persistent ID.
 * Falls back to the provided legacy name if the ID lookup fails.
 *
 * @param state - The name resolution state
 * @param stableId - The persistent ID of the stable
 * @param legacyName - Fallback name if ID is not found
 * @returns The resolved name or legacy fallback
 */
export function resolveStableName(
  state: NameResolutionState,
  stableId: string | undefined,
  legacyName: string
): string {
  if (!stableId) return legacyName;

  const name = ensureEntityIndex(state as EntityIndexState).stableNameById.get(stableId);
  return name || legacyName;
}

/**
 * Resolves a warrior object by ID or Name using the internal cache.
 *
 * @param state - The current game state
 * @param id - Optional persistent ID
 * @param name - Optional display name
 * @returns The resolved Warrior object, or undefined if not found
 */
export function findWarrior(
  state: GameState | NameResolutionState,
  id?: string,
  name?: string
): Warrior | undefined {
  const index = ensureEntityIndex(state as EntityIndexState);

  if (id) {
    const w = index.warriorById.get(id);
    if (w) return w;
  }

  if (name) {
    const w = index.warriorByName.get(name);
    if (w) return w;
  }

  return undefined;
}

/**
 * Finds a stable ID by its name using the internal cache.
 *
 * @param state - The game state or resolution context
 * @param name - The stable's display name
 * @returns The persistent stable ID, or undefined if not found
 */
export function findStableId(
  state: GameState | NameResolutionState,
  name: string
): string | undefined {
  const index = ensureEntityIndex(state as EntityIndexState);
  return index.stableIdByName.get(name);
}
