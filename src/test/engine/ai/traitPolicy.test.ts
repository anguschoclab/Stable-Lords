import { describe, it, expect } from 'vitest';
import { TRAIT_POLICY, OWNER_PERSONALITIES_WITH_POLICY } from '@/engine/ai/traitPolicy';

describe('TRAIT_POLICY', () => {
  it('covers every owner personality', () => {
    for (const p of OWNER_PERSONALITIES_WITH_POLICY) {
      expect(TRAIT_POLICY[p], p).toBeDefined();
      expect(TRAIT_POLICY[p].cutLiabilityThreshold).toBeGreaterThan(0);
      expect(TRAIT_POLICY[p].trainAppetite).toBeGreaterThanOrEqual(0);
    }
  });

  it('Aggressive cuts more readily than Methodical', () => {
    expect(TRAIT_POLICY.Aggressive.cutLiabilityThreshold).toBeLessThan(
      TRAIT_POLICY.Methodical.cutLiabilityThreshold
    );
  });

  it('Showman/Aggressive train more than Pragmatic', () => {
    expect(TRAIT_POLICY.Showman.trainAppetite).toBeGreaterThan(
      TRAIT_POLICY.Pragmatic.trainAppetite
    );
    expect(TRAIT_POLICY.Aggressive.trainAppetite).toBeGreaterThan(
      TRAIT_POLICY.Pragmatic.trainAppetite
    );
  });
});
