/**
 * Trait enduranceMult invariant — all positive-sign traits with enduranceMult
 * must have a value ≤ 1.0 (lower = less endurance cost = better).
 *
 * A value > 1.0 on a positive trait is a bug: it INCREASES endurance drain
 * (makes the warrior tire faster), contradicting any "improved endurance"
 * description. This test catches inversions like the workhouse_resilience
 * bug where enduranceMult was set to 1.1 instead of 0.9.
 */
import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

describe('trait enduranceMult invariant', () => {
  const positiveTraitsWithEnduranceMult = Object.values(TRAITS).filter(
    (t) => t.sign === 'positive' && t.effect.enduranceMult != null
  );

  it('every positive trait with enduranceMult has value ≤ 1.0', () => {
    for (const trait of positiveTraitsWithEnduranceMult) {
      expect(
        trait.effect.enduranceMult!,
        `Trait "${trait.id}" has enduranceMult ${trait.effect.enduranceMult} which is > 1.0 — this INCREASES endurance cost on a positive trait`
      ).toBeLessThanOrEqual(1.0);
    }
  });

  it('no positive trait has enduranceMult > 1.0 (inversion bug)', () => {
    const inversions = positiveTraitsWithEnduranceMult.filter((t) => t.effect.enduranceMult! > 1.0);
    expect(
      inversions.map((t) => `${t.id}=${t.effect.enduranceMult}`),
      `Found positive traits with enduranceMult > 1.0: ${inversions.map((t) => t.id).join(', ')}`
    ).toHaveLength(0);
  });

  it('flaw traits with enduranceMult are allowed to be > 1.0 (debuff)', () => {
    const flawTraitsWithEnduranceMult = Object.values(TRAITS).filter(
      (t) => t.sign === 'negative' && t.effect.enduranceMult != null
    );
    for (const trait of flawTraitsWithEnduranceMult) {
      expect(trait.effect.enduranceMult!).toBeGreaterThan(0);
    }
  });
});
