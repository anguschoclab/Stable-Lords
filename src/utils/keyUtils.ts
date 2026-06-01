/**
 * Standardized key generation for Maps to ensure consistency across the engine.
 */

/**
 * Returns a consistent key for a pair of IDs, regardless of order.
 * Ensures that (A, B) and (B, A) result in the same key.
 */
export function getPairKey(id1: string, id2: string): string {
  if (id1 < id2) return `${id1}|${id2}`;
  return `${id2}|${id1}`;
}

/** Alias for stable-specific usage (backward compatible). */
export const getStablePairKey = getPairKey;

/** Alias for warrior-specific usage (backward compatible). */
export const getWarriorPairKey = getPairKey;
