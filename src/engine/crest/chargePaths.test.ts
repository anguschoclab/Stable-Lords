import { describe, it, expect } from 'vitest';
import {
  getChargePathsByType,
  getRandomCharge,
  BEAST_PATHS,
  WEAPON_PATHS,
  SYMBOL_PATHS,
  NATURE_PATHS,
  CELESTIAL_PATHS,
  MYTHICAL_PATHS,
} from './chargePaths';
import { CHARGE_DEFINITIONS } from '@/types/crest.types';
import type { ChargeType } from '@/types/crest.types';

const ALL_TYPES: ChargeType[] = [
  'beast',
  'weapon',
  'symbol',
  'nature',
  'celestial',
  'mythical',
];

const EXPECTED_COUNTS: Record<ChargeType, number> = {
  beast: 14,
  weapon: 13,
  symbol: 14,
  nature: 14,
  celestial: 8,
  mythical: 12,
};

describe('getChargePathsByType', () => {
  it('1.1 — each valid type returns the correct dictionary by reference', () => {
    expect(getChargePathsByType('beast')).toBe(BEAST_PATHS);
    expect(getChargePathsByType('weapon')).toBe(WEAPON_PATHS);
    expect(getChargePathsByType('symbol')).toBe(SYMBOL_PATHS);
    expect(getChargePathsByType('nature')).toBe(NATURE_PATHS);
    expect(getChargePathsByType('celestial')).toBe(CELESTIAL_PATHS);
    expect(getChargePathsByType('mythical')).toBe(MYTHICAL_PATHS);
  });

  it('1.2 — each returned dictionary is non-empty', () => {
    for (const type of ALL_TYPES) {
      expect(Object.keys(getChargePathsByType(type)).length).toBeGreaterThan(0);
    }
  });

  it('1.3 — every entry in every dictionary has valid ChargePath structure', () => {
    for (const type of ALL_TYPES) {
      const dict = getChargePathsByType(type);
      for (const [, entry] of Object.entries(dict)) {
        expect(typeof entry.path).toBe('string');
        expect(entry.path.length).toBeGreaterThan(0);
        expect(entry.path.startsWith('M')).toBe(true);
        expect(entry.viewBox).toBe('0 0 100 100');
        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('1.4 — all 6 ChargeType union members are covered', () => {
    for (const type of ALL_TYPES) {
      const result = getChargePathsByType(type);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    }
  });

  it('1.5 — default fallback returns BEAST_PATHS', () => {
    expect(getChargePathsByType('invalid' as ChargeType)).toBe(BEAST_PATHS);
    expect(getChargePathsByType('' as ChargeType)).toBe(BEAST_PATHS);
    expect(getChargePathsByType(null as unknown as ChargeType)).toBe(BEAST_PATHS);
  });

  it('1.6 — function returns the same reference, not a copy', () => {
    const result = getChargePathsByType('beast');
    expect(result).toBe(BEAST_PATHS);
    // Mutating result would mutate BEAST_PATHS since they are the same object.
    // We verify reference identity without actually mutating.
    expect(Object.keys(result)).toEqual(Object.keys(BEAST_PATHS));
  });

  it('1.7 — every path key has a description in CHARGE_DEFINITIONS', () => {
    for (const type of ALL_TYPES) {
      const dict = getChargePathsByType(type);
      const descriptions = CHARGE_DEFINITIONS[type]!.descriptions;
      for (const key of Object.keys(dict)) {
        const desc = descriptions[key];
        expect(desc).toBeDefined();
        expect(typeof desc).toBe('string');
        expect(desc!.length).toBeGreaterThan(0);
      }
    }
  });

  it('1.8 — CELESTIAL_PATHS keys are a subset of CHARGE_DEFINITIONS.celestial.names', () => {
    const celestialNames = CHARGE_DEFINITIONS.celestial.names;
    for (const key of Object.keys(CELESTIAL_PATHS)) {
      expect(celestialNames).toContain(key);
    }
    // Known data inconsistency: 'sun' and 'moon' are in CHARGE_DEFINITIONS.celestial.names
    // but NOT in CELESTIAL_PATHS. This is not a runtime bug — selectCharge picks from
    // Object.keys(chargePaths), not from CHARGE_DEFINITIONS.names.
    expect(celestialNames).toContain('sun');
    expect(celestialNames).toContain('moon');
    expect(CELESTIAL_PATHS).not.toHaveProperty('sun');
    expect(CELESTIAL_PATHS).not.toHaveProperty('moon');
  });

  it('1.9 — entry counts match expected values', () => {
    for (const type of ALL_TYPES) {
      expect(Object.keys(getChargePathsByType(type)).length).toBe(EXPECTED_COUNTS[type]);
    }
  });
});

describe('getRandomCharge', () => {
  it('1.10 — returns valid ChargePath with name for each type', () => {
    for (const type of ALL_TYPES) {
      const result = getRandomCharge(type, 0.5);
      expect(typeof result.path).toBe('string');
      expect(result.path.length).toBeGreaterThan(0);
      expect(typeof result.viewBox).toBe('string');
      expect(result.viewBox).toBe('0 0 100 100');
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    }
  });

  it('1.11 — returned name is the key, not the display name', () => {
    const result = getRandomCharge('beast', 0);
    expect(result.name).toBe(result.name.toLowerCase());
    expect(BEAST_PATHS).toHaveProperty(result.name);
    // The name should be the key (e.g. 'lion'), not the display name (e.g. 'Lion')
    const entry = BEAST_PATHS[result.name]!;
    expect(entry).toBeDefined();
    expect(result.name).not.toBe(entry.name);
  });

  it('1.12 — deterministic: same seed + type produces same result', () => {
    const a = getRandomCharge('beast', 0.42);
    const b = getRandomCharge('beast', 0.42);
    expect(a).toEqual(b);
  });

  it('1.13 — seed = 0 returns first key', () => {
    const result = getRandomCharge('beast', 0);
    const firstKey = Object.keys(BEAST_PATHS)[0];
    expect(result.name).toBe(firstKey);
  });

  it('1.14 — seed >= 1 falls back to first key', () => {
    const result = getRandomCharge('beast', 1.0);
    const firstKey = Object.keys(BEAST_PATHS)[0];
    expect(result.name).toBe(firstKey);
  });

  it('1.15 — seed < 0 falls back to first key', () => {
    const result = getRandomCharge('beast', -1);
    const firstKey = Object.keys(BEAST_PATHS)[0];
    expect(result.name).toBe(firstKey);
  });

  it('1.16 — seed = 0.999 returns last key', () => {
    // CELESTIAL_PATHS has 8 keys; Math.floor(0.999 * 8) = 7 → last key
    const result = getRandomCharge('celestial', 0.999);
    const keys = Object.keys(CELESTIAL_PATHS);
    const lastKey = keys[keys.length - 1];
    expect(result.name).toBe(lastKey);
  });

  it('1.17 — returned object is a spread, not the original reference', () => {
    const result = getRandomCharge('beast', 0);
    const firstKey = Object.keys(BEAST_PATHS)[0]!;
    const original = BEAST_PATHS[firstKey]!;
    expect(result).not.toBe(original);
    expect(result.path).toBe(original.path);
    expect(result.viewBox).toBe(original.viewBox);
    // name is overridden: result.name is the key, original.name is the display name
    expect(result.name).toBe(firstKey);
    expect(result.name).not.toBe(original.name);
  });
});
