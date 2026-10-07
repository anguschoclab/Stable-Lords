/**
 * Name generation utilities for Stable Lords.
 * Provides functions to generate random names for warriors, owners, and stables.
 */

import { OWNER_FIRST, OWNER_LAST } from './ownerNames';
import { STABLE_PREFIXES, STABLE_SUFFIXES, STABLE_ALT } from './stableNames';
import { randomPick } from '@/utils/random';
import { cryptoRandom } from '@/utils/cryptoRandom';
import { generateWarriorName } from './nameGenerator';
import type { WarriorNameOptions } from './nameGenerator';
import { cultureForArchetype, cultureForOwner } from './cultures';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 * Generates a random warrior name via the procedural generator.
 * Entropy-seeded when no `rng` is given — deterministic callers should pass
 * an IRNGService (engine paths call generateWarriorName directly).
 *
 * @param opts.archetype - Warrior archetype; its culture flavors the draw.
 * @param opts.personality - Owning stable's personality; blended 50/50 with the
 *   archetype's culture so recruits match the stable's naming tradition.
 * @param opts.culture - Explicit culture or weighted mix; overrides the
 *   personality/archetype blend.
 * @param opts.rng - Deterministic RNG service for reproducible draws.
 * @param opts.usedNames - Name registry to avoid; the caller owns the set.
 * @returns A random warrior name
 */
export function randomWarriorName(opts?: {
  archetype?: string;
  personality?: string | null;
  culture?: WarriorNameOptions['culture'];
  rng?: IRNGService;
  usedNames?: ReadonlySet<string>;
}): string {
  const archetype = opts?.archetype;
  const culture =
    opts?.culture ??
    (opts?.personality
      ? [
          { culture: cultureForOwner(opts.personality), weight: 0.5 },
          ...(archetype ? [{ culture: cultureForArchetype(archetype), weight: 0.5 }] : []),
        ]
      : undefined);
  return generateWarriorName({
    archetype,
    culture,
    rng: opts?.rng,
    usedNames: opts?.usedNames,
  });
}

/**
 * Generates a random owner name by combining first and last names.
 *
 * @param rng - Optional random number generator function
 * @returns A random owner name in "First Last" format
 */
export function randomOwnerName(rng?: () => number): string {
  const firstName = randomPick(OWNER_FIRST, rng ?? cryptoRandom);
  const lastName = randomPick(OWNER_LAST, rng ?? cryptoRandom);
  return `${firstName} ${lastName}`;
}

/**
 * Generates a random stable name using either prefixed format or alternative names.
 *
 * @param rng - Optional random number generator function
 * @returns A random stable name
 */
export function randomStableName(rng?: () => number): string {
  // 50% chance for prefixed name, 50% chance for alternative name
  const usePrefixed = (rng ?? cryptoRandom)() < 0.5;
  return usePrefixed ? randomPrefixedStableName(rng) : randomAltStableName(rng);
}

/**
 * Generates a random prefixed stable name (e.g., "Red Dragon", "Iron Wolf").
 *
 * @param rng - Optional random number generator function
 * @returns A random prefixed stable name
 */
function randomPrefixedStableName(rng?: () => number): string {
  const prefix = randomPick(STABLE_PREFIXES, rng ?? cryptoRandom);
  const suffix = randomPick(STABLE_SUFFIXES, rng ?? cryptoRandom);
  return `${prefix} ${suffix}`;
}

/**
 * Generates a random alternative stable name from the STABLE_ALT array.
 *
 * @param rng - Optional random number generator function
 * @returns A random alternative stable name
 */
function randomAltStableName(rng?: () => number): string {
  return randomPick(STABLE_ALT, rng ?? cryptoRandom);
}
