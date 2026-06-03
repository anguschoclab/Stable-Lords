import { GameState, Warrior } from '@/types/state.types';/**
                                                          * Warrior minimal type.
                                                          */


// Minimal types for history resolution — avoids importing full RivalStableData
/**
 * Warrior minimal type.
 */
export type WarriorMinimal = Pick<Warrior, 'id' | 'name'>;/**
                                                           * Rival shallow type.
                                                           */


/**
 * Rival shallow type.
 */
export type RivalShallow = {
  id: string;
  owner: { stableName: string };
  roster?: WarriorMinimal[];
};/**
   * Defines the shape of name resolution state.
   */


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

type CachedWarrior = { id: string; name: string } & Record<string, unknown>;

interface WarriorCache {
  idMap: Map<string, CachedWarrior>;
  nameMap: Map<string, CachedWarrior>;
}

interface StableCache {
  idMap: Map<string, string>;
  nameMap: Map<string, string>;
}

let warriorCache = new WeakMap<object, WarriorCache>();
let stableCache = new WeakMap<object, StableCache>();

/**
 * Clears all history resolver caches to prevent state pollution across tests.
 * This should be called in test cleanup hooks.
 */
export function clearHistoryResolverCaches(): void {
  warriorCache = new WeakMap<object, WarriorCache>();
  stableCache = new WeakMap<object, StableCache>();
}

/**
 * Ensures a warrior cache exists for the given state using a WeakMap.
 *
 * @param state - The current game state or resolution context
 * @returns The WarriorCache containing ID and Name maps
 */
function ensureWarriorCache(state: NameResolutionState | GameState): WarriorCache {
  let cache = warriorCache.get(state);
  if (cache) return cache;

  const idMap = new Map<string, CachedWarrior>();
  const nameMap = new Map<string, CachedWarrior>();

  const processWarrior = (w: CachedWarrior | undefined) => {
    if (!w) return;
    idMap.set(w.id, w);
    nameMap.set(w.name, w);
  };

  // Process in reverse order of precedence so earlier items overwrite later ones
  // Precedence: roster > graveyard > retired > rivals (first to last)

  // Rivals (last to first)
  const rivals = state.rivals || [];
  for (let i = rivals.length - 1; i >= 0; i--) {
    const rival = rivals[i];
    const roster = rival.roster || [];
    for (let j = roster.length - 1; j >= 0; j--) {
      processWarrior(roster[j]);
    }
  }

  // Retired
  const retired = state.retired || [];
  for (let i = retired.length - 1; i >= 0; i--) {
    processWarrior(retired[i]);
  }

  // Graveyard
  const graveyard = state.graveyard || [];
  for (let i = graveyard.length - 1; i >= 0; i--) {
    processWarrior(graveyard[i]);
  }

  // Roster
  const roster = state.roster || [];
  for (let i = roster.length - 1; i >= 0; i--) {
    processWarrior(roster[i]);
  }

  cache = { idMap, nameMap };
  warriorCache.set(state, cache);
  return cache;
}

/**
 * Ensures a stable cache exists for the given state using a WeakMap.
 *
 * @param state - The current game state or resolution context
 * @returns The StableCache containing ID and Name maps
 */
function ensureStableCache(state: NameResolutionState | GameState): StableCache {
  let cache = stableCache.get(state);
  if (cache) return cache;

  const idMap = new Map<string, string>();
  const nameMap = new Map<string, string>();

  // Rivals (last to first so first one wins)
  const rivals = state.rivals || [];
  for (let i = rivals.length - 1; i >= 0; i--) {
    const rival = rivals[i];
    if (rival && rival.owner) {
      idMap.set(rival.id, rival.owner.stableName);
      nameMap.set(rival.owner.stableName, rival.id);
    }
  }

  // Player (highest precedence)
  if ('player' in state && state.player) {
    idMap.set(state.player.id, state.player.stableName);
    nameMap.set(state.player.stableName, state.player.id);
  }

  cache = { idMap, nameMap };
  stableCache.set(state, cache);
  return cache;
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

  const cache = ensureWarriorCache(state);
  const w = cache.idMap.get(warriorId);
  return w ? w.name : legacyName;
}

/**
 * Resolves a stable's current display name from its persistent ID.
 * Falls back to the provided legacy name if the ID lookup fails.
 *
 * @param state - The name resolution state
 * @param stableId - The persistent ID of the stable
 * @param legacyName - Fallback name if ID is not found
 * @returns The resolved stable name or legacy fallback
 */
export function resolveStableName(
  state: NameResolutionState,
  stableId: string | undefined,
  legacyName: string
): string {
  if (!stableId) return legacyName;

  const cache = ensureStableCache(state);
  const name = cache.idMap.get(stableId);
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
export function findWarrior(state: GameState | NameResolutionState, id?: string, name?: string): Warrior | undefined {
  const cache = ensureWarriorCache(state);

  if (id) {
    const w = cache.idMap.get(id);
    if (w) return w as Warrior;
  }

  if (name) {
    const w = cache.nameMap.get(name);
    if (w) return w as Warrior;
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
  const cache = ensureStableCache(state);
  return cache.nameMap.get(name);
}
