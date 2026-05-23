import type { ArenaConfig, ArenaTag } from '@/types/shared.types';

const registry = new Map<string, ArenaConfig>();

// Internal caches for optimized retrieval
let allCache: ArenaConfig[] | null = null;
const tagIndex = new Map<ArenaTag, ArenaConfig[]>();
const tierIndex = new Map<number, ArenaConfig[]>();/**
                                                    * Register arena.
                                                    * @param arena - Arena.
                                                    * @returns The result.
                                                    */


/**
 * Register arena.
 * @param arena - Arena.
 * @returns The result.
 */
export function registerArena(arena: ArenaConfig): void {
  registry.set(arena.id, arena);
  // Clear caches on registry change
  allCache = null;
  tagIndex.clear();
  tierIndex.clear();
}/**
  * Get arena by id.
  * @param id - Id.
  * @returns The result.
  */


/**
 * Get arena by id.
 * @param id - Id.
 * @returns The result.
 */
export function getArenaById(id: string): ArenaConfig {
  return registry.get(id) ?? STANDARD_ARENA;
}/**
  * Get all arenas.
  * @returns The result.
  */


/**
 * Get all arenas.
 * @returns The result.
 */
export function getAllArenas(): ArenaConfig[] {
  if (!allCache) {
    allCache = Array.from(registry.values());
  }
  return [...allCache];
}/**
  * Get arenas by tag.
  * @param tag - Tag.
  * @returns The result.
  */


/**
 * Get arenas by tag.
 * @param tag - Tag.
 * @returns The result.
 */
export function getArenasByTag(tag: ArenaTag): ArenaConfig[] {
  let results = tagIndex.get(tag);
  if (!results) {
    results = getAllArenas().filter((a) => a.tags.includes(tag));
    tagIndex.set(tag, results);
  }
  return [...results];
}/**
  * Get arenas by tier.
  * @param tier - Tier.
  * @returns The result.
  */


/**
 * Get arenas by tier.
 * @param tier - Tier.
 * @returns The result.
 */
export function getArenasByTier(tier: 1 | 2 | 3): ArenaConfig[] {
  let results = tierIndex.get(tier);
  if (!results) {
    results = getAllArenas().filter((a) => a.tier === tier);
    tierIndex.set(tier, results);
  }
  return [...results];
}/**
  * Is indoor arena.
  * @param id - Id. (optional)
  * @returns The result.
  */


/**
 * Is indoor arena.
 * @param id - Id. (optional)
 * @returns The result.
 */
export function isIndoorArena(id?: string): boolean {
  if (!id) return false;
  const arena = registry.get(id);
  return !!arena?.tags.includes('indoor');
}/**
  * Standard_arena.
  */


// ─── Seed Arenas ─────────────────────────────────────────────────────────────

/**
 * Standard_arena.
 */
export const STANDARD_ARENA: ArenaConfig = {
  id: 'standard_arena',
  name: 'The Proving Grounds',
  tags: ['outdoor', 'open'],
  tier: 1,
  description: 'A flat, sandy arena. No particular advantage to either style.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
  startingZone: 'Center',
};/**
   * Mudpit_arena.
   */


/**
 * Mudpit_arena.
 */
export const MUDPIT_ARENA: ArenaConfig = {
  id: 'mudpit_arena',
  name: 'The Mudpit',
  tags: ['outdoor', 'water'],
  tier: 1,
  description: 'A sunken, rain-soaked arena. Footing is treacherous.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: -1 },
  startingZone: 'Center',
};/**
   * Bloodsands_arena.
   */


/**
 * Bloodsands_arena.
 */
export const BLOODSANDS_ARENA: ArenaConfig = {
  id: 'bloodsands_arena',
  name: 'The Bloodsands',
  tags: ['outdoor', 'open', 'premium'],
  tier: 2,
  description: 'The grand arena. Fine sand, excellent footing, long sight lines.',
  zoneDef: { Edge: -2, Corner: -3 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 0.95, riposteMod: 1 },
  startingZone: 'Center',
};/**
   * Underpit_arena.
   */


/**
 * Underpit_arena.
 */
export const UNDERPIT_ARENA: ArenaConfig = {
  id: 'underpit_arena',
  name: 'The Underpit',
  tags: ['indoor', 'cramped'],
  tier: 2,
  description: 'A torch-lit subterranean pit. Tight quarters favour close-range fighters.',
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -1 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: 0 },
  startingZone: 'Center',
};

// ─── Auto-register ────────────────────────────────────────────────────────────
[STANDARD_ARENA, MUDPIT_ARENA, BLOODSANDS_ARENA, UNDERPIT_ARENA].forEach(registerArena);
