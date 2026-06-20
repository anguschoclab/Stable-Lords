import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

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
