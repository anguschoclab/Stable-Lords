/**
 * Collection indexing utilities — one-pass Map/Set builders that replace
 * `arr.find()`/`arr.filter()`/`arr.includes()` executed once per loop
 * iteration. Build the index once before the loop; lookups are O(1).
 */

/**
 * Build a key → item Map in one pass. The FIRST item wins on key collision —
 * a drop-in replacement for `arr.find(x => x.k === v)` semantics.
 *
 * @param items - Source array (undefined tolerated → empty Map)
 * @param key - Key extractor
 * @returns Map of key → first item with that key
 */
export function indexBy<T, K>(
  items: readonly T[] | undefined,
  key: (item: T) => K
): Map<K, T> {
  const map = new Map<K, T>();
  if (!items) return map;
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, item);
  }
  return map;
}

/**
 * Group items into a key → item[] Map in one pass, preserving insertion
 * order within each bucket — a drop-in replacement for
 * `arr.filter(pred)` executed per key inside a loop.
 *
 * @param items - Source array (undefined tolerated → empty Map)
 * @param key - Bucket-key extractor
 * @returns Map of key → items sharing that key, in original order
 */
export function groupBy<T, K>(
  items: readonly T[] | undefined,
  key: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  if (!items) return map;
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}

/**
 * Build a Set of extracted keys in one pass — a drop-in replacement for
 * `arr.includes(v)`/`arr.indexOf(v)` membership checks inside a loop.
 *
 * @param items - Source array (undefined tolerated → empty Set)
 * @param key - Key extractor
 * @returns Set of extracted keys
 */
export function keySet<T, K>(items: readonly T[] | undefined, key: (item: T) => K): Set<K> {
  const set = new Set<K>();
  if (!items) return set;
  for (const item of items) set.add(key(item));
  return set;
}
