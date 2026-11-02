import { describe, it, expect } from 'vitest';
import { generateArchetypeAttrs } from '@/engine/factories/statGeneration';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';
import {
  FightingStyle,
  ATTRIBUTE_KEYS,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  type Attributes,
} from '@/types/shared.types';
import { SeededRNG } from '@/utils/random';

const JITTER = 3;

/** Distance of a generated spread from the nearest canon concept for the style. */
function nearestConceptDistance(style: FightingStyle, attrs: Attributes): number {
  const concepts = FIGHTER_CONCEPTS[style].concepts;
  return Math.min(
    ...concepts.map((c) =>
      Math.max(...ATTRIBUTE_KEYS.map((k) => Math.abs(attrs[k] - c.stats[k])))
    )
  );
}

describe('statGeneration', () => {
  it('generates valid attributes for all archetypes', () => {
    const rng = new SeededRNG(12345);

    // Test a sample style for each archetype
    const stylesToTest = [
      FightingStyle.StrikingAttack, // brutal
      FightingStyle.LungingAttack, // agile
      FightingStyle.AimedBlow, // cunning
      FightingStyle.TotalParry, // tank
    ];

    for (const style of stylesToTest) {
      const attrs = generateArchetypeAttrs(style, rng);

      let total = 0;
      for (const key of ATTRIBUTE_KEYS) {
        expect(attrs[key]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
        expect(attrs[key]).toBeLessThanOrEqual(ATTRIBUTE_MAX);
        total += attrs[key];
      }

      // Expected point total is ~68-74
      expect(total).toBeGreaterThanOrEqual(68);
      expect(total).toBeLessThanOrEqual(74);
    }
  });

  it('stays near a canonical fighter concept for the style', () => {
    const rng = new SeededRNG(999);

    // Canon striker builds are WT/WL/DF-led (not ST/CN/SZ like the old
    // 'brutal' archetype): the generated spread must sit within jitter range
    // of one of the style's concepts.
    for (const style of Object.values(FightingStyle)) {
      const attrs = generateArchetypeAttrs(style, rng);
      const dist = nearestConceptDistance(style, attrs);
      expect(
        dist,
        `${style} spread ${JSON.stringify(attrs)} drifts ${dist} from every concept`
      ).toBeLessThanOrEqual(JITTER);
    }
  });

  it('exhausts point pool appropriately without exceeding caps', () => {
    // Generate many sets to hit edge cases in random distributions
    const rng = new SeededRNG(42);

    for (let i = 0; i < 50; i++) {
      const style = rng.pick(Object.values(FightingStyle));
      const attrs = generateArchetypeAttrs(style, rng);

      let total = 0;
      for (const key of ATTRIBUTE_KEYS) {
        total += attrs[key];
      }

      expect(total).toBeGreaterThanOrEqual(68);
      expect(total).toBeLessThanOrEqual(74);
    }
  });

  it('is deterministic — same seed produces the same spread', () => {
    const a = generateArchetypeAttrs(FightingStyle.ParryRiposte, new SeededRNG(7));
    const b = generateArchetypeAttrs(FightingStyle.ParryRiposte, new SeededRNG(7));
    expect(a).toEqual(b);
  });

  it('does not return the shared concept spread by reference', () => {
    const rng = new SeededRNG(11);
    const attrs = generateArchetypeAttrs(FightingStyle.WallOfSteel, rng);
    for (const concept of FIGHTER_CONCEPTS[FightingStyle.WallOfSteel].concepts) {
      expect(attrs).not.toBe(concept.stats);
    }
  });
});
