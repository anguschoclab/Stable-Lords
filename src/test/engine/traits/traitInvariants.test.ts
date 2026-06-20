import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';
import { FightingStyle } from '@/types/shared.types';

const VALID_TIERS = ['Common', 'Notable', 'Exceptional', 'Signature', 'Flaw'];

describe('trait invariants', () => {
  it('every trait has a non-empty tooltip description', () => {
    const missing = Object.values(TRAITS).filter((t) => !t.description || t.description.trim().length < 5);
    expect(missing.map((t) => t.id)).toEqual([]);
  });

  it('every trait has a valid tier and matching sign', () => {
    for (const t of Object.values(TRAITS)) {
      expect(VALID_TIERS, `${t.id} tier`).toContain(t.tier);
      const expectedSign = t.tier === 'Flaw' ? 'negative' : 'positive';
      expect(t.sign, `${t.id} sign`).toBe(expectedSign);
    }
  });

  it('id matches the map key and name is present', () => {
    for (const [key, t] of Object.entries(TRAITS)) {
      expect(t.id, `key ${key}`).toBe(key);
      expect(t.name?.length ?? 0, `${t.id} name`).toBeGreaterThan(0);
    }
  });
});

describe('class-trait coverage', () => {
  const byStyle = (style: FightingStyle) =>
    Object.values(TRAITS).filter((t) => t.styles?.includes(style));

  it('every style has at least 5 class-specific traits', () => {
    for (const style of Object.values(FightingStyle)) {
      expect(byStyle(style).length, `${style} class traits`).toBeGreaterThanOrEqual(5);
    }
  });

  it('class traits are styles-restricted and positive', () => {
    for (const t of Object.values(TRAITS)) {
      if (t.styles && t.styles.length > 0) {
        expect(t.sign, `${t.id}`).toBe('positive');
        expect(t.tier, `${t.id}`).not.toBe('Flaw');
      }
    }
  });
});
