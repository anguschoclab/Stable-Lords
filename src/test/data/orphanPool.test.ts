import { describe, it, expect } from 'vitest';
import { generateOrphanPool } from '@/data/orphanPool';
import { ATTRIBUTE_MIN, ATTRIBUTE_MAX } from '@/types/shared.types';

/**
 * generateOrphanPool — intake attribute invariants.
 * Trait attrBonus effects are applied at intake and must never push an
 * attribute outside the legal band (schema round-trip invariant).
 */
describe('generateOrphanPool', () => {
  it('keeps every attribute inside [ATTRIBUTE_MIN, ATTRIBUTE_MAX] across seeds', () => {
    for (const seed of [1, 42, 777, 2026]) {
      const pool = generateOrphanPool(16, seed);
      expect(pool.length).toBe(16);
      for (const orphan of pool) {
        for (const [key, value] of Object.entries(orphan.attrs)) {
          expect(
            value,
            `seed ${seed} ${orphan.name} ${key} = ${value}`
          ).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
          expect(
            value,
            `seed ${seed} ${orphan.name} ${key} = ${value}`
          ).toBeLessThanOrEqual(ATTRIBUTE_MAX);
        }
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(generateOrphanPool(8, 99)).toEqual(generateOrphanPool(8, 99));
  });
});
