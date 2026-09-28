// Split from data/arenas.ts — arena registry + query helpers
import type { ArenaConfig, ArenaTag } from '@/types/shared.types';



const registry = new Map<string, ArenaConfig>();



// Internal caches for optimized retrieval
let allCache: ArenaConfig[] | null = null;


const tagIndex = new Map<ArenaTag, ArenaConfig[]>();


const tierIndex = new Map<number, ArenaConfig[]>();



/**
 * Register an arena config in the global registry.
 * Clears internal caches on change.
 * @param arena - Arena configuration to register.
 */
export function registerArena(arena: ArenaConfig): void {
  registry.set(arena.id, arena);
  // Clear caches on registry change
  allCache = null;
  tagIndex.clear();
  tierIndex.clear();
}



/** Fallback arena for unknown ids — injected by index.ts (registry must not
 * import venue data or it would create a module cycle). */
let defaultArena: ArenaConfig | null = null;

/**
 * Set the fallback arena returned for unknown ids.
 * @param arena - Arena configuration to use as the default.
 */
export function setDefaultArena(arena: ArenaConfig): void {
  defaultArena = arena;
}

/**
 * Get arena by id.
 * @param id - Arena identifier.
 * @returns The ArenaConfig, or the default arena if not found.
 */
export function getArenaById(id: string): ArenaConfig {
  const arena = registry.get(id) ?? defaultArena;
  if (!arena) throw new Error(`arena '${id}' not registered and no default set`);
  return arena;
}



/**
 * Get all registered arenas.
 * @returns Array of all ArenaConfig entries.
 */
export function getAllArenas(): ArenaConfig[] {
  if (!allCache) {
    allCache = Array.from(registry.values());
  }
  return [...allCache];
}



/**
 * Get arenas filtered by a specific tag.
 * @param tag - Arena tag to filter by.
 * @returns Array of arenas matching the tag.
 */
export function getArenasByTag(tag: ArenaTag): ArenaConfig[] {
  let results = tagIndex.get(tag);
  if (!results) {
    results = getAllArenas().filter((a) => a.tags.includes(tag));
    tagIndex.set(tag, results);
  }
  return [...results];
}



/**
 * Get arenas filtered by tier level.
 * @param tier - Tier level (1, 2, or 3).
 * @returns Array of arenas at the specified tier.
 */
export function getArenasByTier(tier: 1 | 2 | 3): ArenaConfig[] {
  let results = tierIndex.get(tier);
  if (!results) {
    results = getAllArenas().filter((a) => a.tier === tier);
    tierIndex.set(tier, results);
  }
  return [...results];
}



// Arena configs are registry-static objects — a WeakMap keyed on the config
// memoizes one tag Set per arena without mutating ArenaConfig.
const tagSetCache = new WeakMap<ArenaConfig, Set<ArenaTag>>();



/**
 * Get a memoized Set of an arena's tags for O(1) membership checks.
 * @param arena - Arena configuration.
 * @returns Set of ArenaTag for the arena.
 */
export function arenaTagSet(arena: ArenaConfig): Set<ArenaTag> {
  let s = tagSetCache.get(arena);
  if (!s) {
    s = new Set(arena.tags);
    tagSetCache.set(arena, s);
  }
  return s;
}



/**
 * Check if an arena is indoors.
 * @param id - Arena identifier (optional).
 * @returns True if the arena has the 'indoor' tag.
 */
export function isIndoorArena(id?: string): boolean {
  if (!id) return false;
  const arena = registry.get(id);
  return !!arena?.tags.includes('indoor');
}

/** Snapshot the registered arenas (used by index.ts for test reset). */
export function snapshotRegistry(): Map<string, ArenaConfig> {
  return new Map(registry);
}

/** Restore the registry to a captured snapshot (test-only). */
export function restoreRegistry(snap: Map<string, ArenaConfig>): void {
  registry.clear();
  for (const [id, arena] of snap) registry.set(id, arena);
  allCache = null;
  tagIndex.clear();
  tierIndex.clear();
}
