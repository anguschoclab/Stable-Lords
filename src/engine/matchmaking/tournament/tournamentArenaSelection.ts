/**
 * Tournament Arena Selection
 * Determines which arenas are eligible for tournament bouts.
 */

import { getAllArenas } from '@/data/arenas';
import type { ArenaConfig, ArenaTag } from '@/types/shared.types';
import { ARENA_SELECTION, ARENA_TAG_WEIGHTS, TOURNAMENT_ARENA_DEFAULTS } from '@/constants/arena';

/**
 *
 */
export interface TournamentArenaFilter {
  minTier?: 1 | 2 | 3;
  maxTier?: 1 | 2 | 3;
  requireTags?: ArenaTag[];
  excludeTags?: ArenaTag[];
  bracketSize?: number; // 4, 8, 16, 32 - larger brackets need bigger arenas
}

/**
 * Get arenas eligible for tournament use.
 * Default: tier 2-3 arenas (prestigious), excludes cramped for large brackets.
 */
export function getEligibleArenasForTournament(filter: TournamentArenaFilter = {}): ArenaConfig[] {
  const {
    minTier = TOURNAMENT_ARENA_DEFAULTS.MIN_TIER,
    maxTier = TOURNAMENT_ARENA_DEFAULTS.MAX_TIER,
    requireTags = [],
    excludeTags = [],
    bracketSize = 8,
  } = filter;

  const allArenas = getAllArenas();

  return allArenas.filter((arena) => {
    // Tier filter
    if (arena.tier < minTier || arena.tier > maxTier) return false;

    // Tag requirements
    for (const tag of requireTags) {
      if (!arena.tags.includes(tag)) return false;
    }

    // Tag exclusions
    for (const tag of excludeTags) {
      if (arena.tags.includes(tag)) return false;
    }

    // Bracket size constraints
    if (bracketSize >= TOURNAMENT_ARENA_DEFAULTS.LARGE_BRACKET_THRESHOLD) {
      // Large brackets need standard+ size
      if (arena.size === 'cramped') return false;
    }

    return true;
  });
}

/**
 * Select a random arena for a tournament bout.
 * Uses weighted selection based on arena tier and tag weights.
 */
export function selectArenaForTournamentBout(
  rng: () => number,
  filter?: TournamentArenaFilter
): string {
  const eligible = getEligibleArenasForTournament(filter);

  if (eligible.length === 0) {
    return ARENA_SELECTION.TOURNAMENT_DEFAULT_ARENA; // 'bloodsands_arena'
  }

  // Weight by tier (higher tier = more prestigious = more likely)
  const weights = eligible.map((arena) => {
    let weight = arena.tier;

    // Apply tag weights
    for (const tag of arena.tags) {
      const tagWeight = ARENA_TAG_WEIGHTS[tag as keyof typeof ARENA_TAG_WEIGHTS];
      if (tagWeight && typeof tagWeight.weight === 'number') {
        weight *= tagWeight.weight;
      }
    }

    // Bonus for premium tag
    if (arena.tags.includes('premium')) weight *= 1.2;

    return Math.max(0.1, weight); // Ensure minimum weight
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let pick = rng() * totalWeight;

  for (let i = 0; i < eligible.length; i++) {
    const w = weights[i];
    const arena = eligible[i];
    if (w === undefined || !arena) continue;
    pick -= w;
    if (pick <= 0) return arena.id;
  }

  return eligible[eligible.length - 1]?.id ?? ARENA_SELECTION.TOURNAMENT_DEFAULT_ARENA;
}
