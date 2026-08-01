import { describe, it, expect } from 'vitest';
import { getAllArenas, getArenaById, STANDARD_ARENA } from '@/data/arenas';

describe('dataIntegrityArenas', () => {
  it('all arena IDs are unique', () => {
    const all = getAllArenas();
    const ids = all.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('all arenas have required fields', () => {
    const all = getAllArenas();
    for (const arena of all) {
      expect(arena.id).toBeDefined();
      expect(typeof arena.id).toBe('string');
      expect(arena.name).toBeDefined();
      expect(typeof arena.name).toBe('string');
      expect(arena.tier).toBeDefined();
      expect(typeof arena.tier).toBe('number');
    }
  });

  it('STANDARD_ARENA is accessible via getArenaById', () => {
    expect(getArenaById('standard_arena')).toBe(STANDARD_ARENA);
  });

  it('all arena tiers are within valid range (1-5)', () => {
    const all = getAllArenas();
    for (const arena of all) {
      expect(arena.tier).toBeGreaterThanOrEqual(1);
      expect(arena.tier).toBeLessThanOrEqual(5);
    }
  });

  it('arena surfaceMod values are finite numbers', () => {
    const all = getAllArenas();
    for (const arena of all) {
      if (arena.surfaceMod) {
        const sm = arena.surfaceMod as any;
        for (const key of Object.keys(sm)) {
          const val = sm[key];
          if (typeof val === 'number') {
            expect(Number.isFinite(val), `Arena ${arena.id} surfaceMod.${key} is not finite`).toBe(true);
          }
        }
      }
    }
  });
});
