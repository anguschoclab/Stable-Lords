import { describe, it, expect } from 'vitest';
import {
  getAllArenas,
  getArenaById,
  getNormalArenas,
  STANDARD_ARENA,
} from '@/data/arenas';
import { ARENA_ROSTER_LIMITS, SPECIAL_ARENA_IDS } from '@/constants/arena';

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

  it('arena roster respects the 50-normal cap and per-tier distribution targets', () => {
    const all = getAllArenas();
    expect(
      all.length,
      `roster has ${all.length} arenas — hard cap is ${ARENA_ROSTER_LIMITS.TOTAL_CAP}`
    ).toBeLessThanOrEqual(ARENA_ROSTER_LIMITS.TOTAL_CAP);

    const normal = getNormalArenas();
    expect(
      normal.length,
      `normal pool has ${normal.length} arenas — cap is ${ARENA_ROSTER_LIMITS.NORMAL_CAP}`
    ).toBeLessThanOrEqual(ARENA_ROSTER_LIMITS.NORMAL_CAP);

    for (const tier of [1, 2, 3] as const) {
      const count = normal.filter((a) => a.tier === tier).length;
      const cap = ARENA_ROSTER_LIMITS.TIER_CAPS[tier];
      expect(
        count,
        `normal tier ${tier} has ${count} arenas — target ceiling is ${cap}`
      ).toBeLessThanOrEqual(cap);
    }
  });

  it('getNormalArenas excludes all special venues', () => {
    const normal = getNormalArenas();
    const normalIds = new Set(normal.map((a) => a.id));
    for (const id of SPECIAL_ARENA_IDS) {
      expect(normalIds.has(id), `special arena ${id} leaked into normal pool`).toBe(false);
    }
    expect(getAllArenas().length - normal.length).toBe(SPECIAL_ARENA_IDS.length);
  });

  it('the_wailing_chasm is removed from the roster', () => {
    expect(getAllArenas().some((a) => a.id === 'the_wailing_chasm')).toBe(false);
  });

  it('arena surfaceMod values are finite numbers', () => {
    const all = getAllArenas();
    for (const arena of all) {
      if (arena.surfaceMod) {
        const sm = arena.surfaceMod as any;
        for (const key of Object.keys(sm)) {
          const val = sm[key];
          if (typeof val === 'number') {
            expect(Number.isFinite(val), `Arena ${arena.id} surfaceMod.${key} is not finite`).toBe(
              true
            );
          }
        }
      }
    }
  });
});
