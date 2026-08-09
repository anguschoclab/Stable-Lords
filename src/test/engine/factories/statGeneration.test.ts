import { describe, it, expect } from 'vitest';
import { generateArchetypeAttrs, STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import { FightingStyle, type Attributes, ATTRIBUTE_KEYS } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';

describe('statGeneration', () => {
  it('generates valid attributes for all archetypes', () => {
    const rng = new SeededRNGService(12345);

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
        expect(attrs[key]).toBeGreaterThanOrEqual(3);
        expect(attrs[key]).toBeLessThanOrEqual(25);
        total += attrs[key];
      }

      // Expected point total is ~68-74
      expect(total).toBeGreaterThanOrEqual(68);
      expect(total).toBeLessThanOrEqual(74);
    }
  });

  it('verifies that high priority stats get higher values than low priority stats', () => {
    const rng = new SeededRNGService(999);

    // Test brutal archetype (high: ST, CN, SZ; low: WT, SP, DF)
    const attrs = generateArchetypeAttrs(FightingStyle.StrikingAttack, rng);

    const highSum = attrs.ST + attrs.CN + attrs.SZ;
    const lowSum = attrs.WT + attrs.SP + attrs.DF;

    expect(highSum).toBeGreaterThan(lowSum);
  });

  it('exhausts point pool appropriately without exceeding caps', () => {
    // Generate many sets to hit edge cases in random distributions
    const rng = new SeededRNGService(42);

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
});
