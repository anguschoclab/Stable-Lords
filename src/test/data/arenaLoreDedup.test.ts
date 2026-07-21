/**
 * Arena lore dedup — verifies no duplicate arena lore IDs or narratives.
 */
import { describe, it, expect } from 'vitest';
import { ARENA_LORE } from '@/data/arenas';

describe('arena lore dedup', () => {
  it('ARENA_LORE has no duplicate IDs', () => {
    const ids = ARENA_LORE.map((entry) => entry.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size, `Duplicate arena lore IDs found`).toBe(ids.length);
  });

  it('ARENA_LORE has no duplicate narratives', () => {
    const narratives = ARENA_LORE.map((entry) => entry.narrative);
    const uniqueNarratives = new Set(narratives);
    expect(uniqueNarratives.size, `Duplicate arena lore narratives found`).toBe(narratives.length);
  });
});
