import type { GameState } from '@/types/state.types';
import { stripNonSerializable } from '@/state/serialization';

/**
 * Stable hash of the serializable shard state — used to verify that a
 * synced shard worker's replayed state is identical to the coordinator's at
 * each pipeline stage boundary.
 *
 * Keys are sorted recursively so the hash is independent of insertion order
 * (resolveImpacts mutations can produce the same content with different
 * key order). Week caches and the cross-week display stash are stripped via
 * the canonical stripNonSerializable — they are rebuilt locally and never
 * transport-verified.
 *
 * FNV-1a (two interleaved 32-bit lanes): portable across main thread and
 * workers (no node:crypto); BigInt ops proved too slow at multi-MB state
 * sizes — ~15 hashes per week per worker made verification the bottleneck.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (value instanceof Map) {
    const entries = [...value.entries()]
      .map(([k, v]) => `${JSON.stringify(k)}=>${stableStringify(v)}`)
      .sort();
    return `M{${entries.join(',')}}`;
  }
  if (value instanceof Set) {
    const items = [...value].map((v) => stableStringify(v)).sort();
    return `S{${items.join(',')}}`;
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value as object).sort();
  return `{${keys
    .map((k) => {
      const v = (value as Record<string, unknown>)[k];
      return v === undefined ? '' : `${JSON.stringify(k)}:${stableStringify(v)}`;
    })
    .filter(Boolean)
    .join(',')}}`;
}

/**
 * FNV-1a receipt hash of the state's canonical serialization — the value
 * the coordinator compares against a worker's post-replay hash to verify
 * shard-state sync.
 */
export function shardStateHash(state: GameState): string {
  const s = stableStringify(stripNonSerializable(state));
  // Two interleaved 32-bit FNV-1a lanes (offset-basis + position-mixed):
  // 64-bit effective space at number speed — verification, not crypto.
  let h1 = 0x811c9dc5;
  let h2 = 0x9dc5811c;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ (c + i), 0x01000193);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}
