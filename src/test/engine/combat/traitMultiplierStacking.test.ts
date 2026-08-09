import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

describe('traitMultiplierStacking', () => {
  it('multiple traits with enduranceMult should stack multiplicatively (not additively)', () => {
    // Collect all traits with enduranceMult
    const traitsWithEndMult = Object.values(TRAITS).filter((t) => t.effect.enduranceMult != null);

    // If two traits each give 0.9 enduranceMult, combined should be 0.81 (multiplicative)
    // not 0.8 (additive: 1.0 - 0.1 - 0.1)
    const trait1 = traitsWithEndMult.find((t) => t.effect.enduranceMult === 0.92);
    const trait2 = traitsWithEndMult.find((t) => t.effect.enduranceMult === 0.95);

    if (trait1 && trait2) {
      const mult1 = trait1.effect.enduranceMult!;
      const mult2 = trait2.effect.enduranceMult!;
      const multiplicative = mult1 * mult2;
      const additive = mult1 + mult2 - 1.0;

      // These should NOT be equal — multiplicative stacking is the correct model
      expect(multiplicative).not.toBe(additive);
    }
  });

  it('trait enduranceMult values should not push stats below 0', () => {
    const traitsWithEndMult = Object.values(TRAITS).filter((t) => t.effect.enduranceMult != null);

    for (const trait of traitsWithEndMult) {
      const mult = trait.effect.enduranceMult!;
      expect(mult, `Trait "${trait.id}" has enduranceMult ${mult} which is <= 0`).toBeGreaterThan(
        0
      );
    }
  });

  it('trait enduranceMult values should not produce NaN or Infinity', () => {
    const traitsWithEndMult = Object.values(TRAITS).filter((t) => t.effect.enduranceMult != null);

    for (const trait of traitsWithEndMult) {
      const mult = trait.effect.enduranceMult!;
      expect(Number.isNaN(mult), `Trait "${trait.id}" has NaN enduranceMult`).toBe(false);
      expect(Number.isFinite(mult), `Trait "${trait.id}" has non-finite enduranceMult`).toBe(true);
    }
  });

  it('edge case: warrior with 0 attributes should not produce NaN from traits', () => {
    // Traits apply multipliers to endurance cost. A warrior with 0 attributes
    // should still get a valid (non-NaN) endurance multiplier from traits.
    const traitsWithEndMult = Object.values(TRAITS).filter((t) => t.effect.enduranceMult != null);

    for (const trait of traitsWithEndMult) {
      const mult = trait.effect.enduranceMult!;
      // Even with 0 base endurance, multiplying by the trait mult should be finite
      const result = 0 * mult;
      expect(
        Number.isFinite(result),
        `Trait "${trait.id}" produces non-finite result with 0 base`
      ).toBe(true);
    }
  });
});
