/**
 * Trait validation — verifies all traits have valid effects with no
 * invalid FightPlan properties (e.g. minStaminaRsv, parryRate).
 */
import { describe, it, expect } from 'vitest';
import { TRAITS, getStaticTraitMods } from '@/engine/traits';

const KNOWN_INVALID_KEYS = ['minStaminaRsv', 'parryRate'];

describe('trait validation', () => {
  const traitEntries = Object.entries(TRAITS);

  it('no trait has fightPlanMod with invalid properties', () => {
    for (const [id, trait] of traitEntries) {
      const fpm = trait.effect.fightPlanMod;
      if (!fpm) continue;
      for (const key of Object.keys(fpm)) {
        expect(KNOWN_INVALID_KEYS, `Trait "${id}" has invalid fightPlanMod key: "${key}"`).not.toContain(key);
      }
    }
  });

  it('no duplicate trait IDs in TRAITS', () => {
    const ids = traitEntries.map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all trait effects have at least one property', () => {
    for (const [id, trait] of traitEntries) {
      const effectKeys = Object.keys(trait.effect);
      expect(effectKeys.length, `Trait "${id}" has empty effect`).toBeGreaterThan(0);
    }
  });

  it('all traits have weight > 0', () => {
    for (const [id, trait] of traitEntries) {
      expect(trait.weight, `Trait "${id}" has weight <= 0`).toBeGreaterThan(0);
    }
  });

  it('getStaticTraitMods returns object for a known trait', () => {
    const firstTrait = traitEntries[0];
    if (firstTrait) {
      const mockWarrior = { traits: [firstTrait[0]] } as any;
      const mods = getStaticTraitMods(mockWarrior);
      expect(mods).toBeDefined();
      expect(typeof mods).toBe('object');
    }
  });
});
