/**
 * Warrior names deduplication — verifies no duplicate names exist
 * in the WARRIOR_NAMES collection.
 */
import { describe, it, expect } from 'vitest';
import { WARRIOR_NAMES } from '@/data/names/warriorNames';

describe('warrior names deduplication', () => {
  it('WARRIOR_NAMES has no duplicates', () => {
    const names = WARRIOR_NAMES;
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all warrior names are non-empty strings', () => {
    for (const name of WARRIOR_NAMES) {
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('all warrior names are uppercase', () => {
    for (const name of WARRIOR_NAMES) {
      expect(name).toBe(name.toUpperCase());
    }
  });

  it('WARRIOR_NAMES has at least 100 entries', () => {
    expect(WARRIOR_NAMES.length).toBeGreaterThanOrEqual(100);
  });
});
