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
        for (const [key, value] of Object.entries(orphan.attributes)) {
          expect(value, `seed ${seed} ${orphan.name} ${key} = ${value}`).toBeGreaterThanOrEqual(
            ATTRIBUTE_MIN
          );
          expect(value, `seed ${seed} ${orphan.name} ${key} = ${value}`).toBeLessThanOrEqual(
            ATTRIBUTE_MAX
          );
        }
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(generateOrphanPool(8, 99)).toEqual(generateOrphanPool(8, 99));
  });

  it('is deterministic with the default seed when none is provided', () => {
    expect(generateOrphanPool(8)).toEqual(generateOrphanPool(8));
  });

  it('varies output across seeds', () => {
    expect(generateOrphanPool(8, 1)).not.toEqual(generateOrphanPool(8, 2));
  });

  it('produces full PoolWarrior-shaped orphans sourced from the orphanage', () => {
    const pool = generateOrphanPool(8, 5);
    const names = new Set<string>();
    for (const o of pool) {
      expect(o.source).toBe('orphanage');
      expect(o.traits.length).toBeGreaterThan(0);
      expect(typeof o.cost).toBe('number');
      expect(o.lore.length).toBeGreaterThan(0);
      expect(o.id).toBeTruthy();
      expect(o.potential).toBeDefined();
      expect(o.baseSkills).toBeDefined();
      expect(o.derivedStats).toBeDefined();
      expect(o.favorites).toBeDefined();
      expect(o.luckfactor).toBeDefined();
      expect(o.tier).toBeDefined();
      expect(o.age).toBeGreaterThanOrEqual(15);
      names.add(o.name);
    }
    // Name uniqueness within a generated pool
    expect(names.size).toBe(pool.length);
  });

  it('honors a caller-provided usedNames set', () => {
    const first = generateOrphanPool(8, 7);
    const taken = new Set(first.map((o) => o.name));
    const second = generateOrphanPool(8, 7, taken);
    expect(second.every((o) => taken.has(o.name))).toBe(false);
  });
});
