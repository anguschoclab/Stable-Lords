import { describe, it, expect } from 'vitest';
import { FightingStyle } from '@/types/shared.types';
import { traitsForStyle, traitsByTier } from '@/engine/traits';

describe('trait accessors', () => {
  it("traitsForStyle returns only that style's class traits", () => {
    const ab = traitsForStyle(FightingStyle.AimedBlow);
    expect(ab.length).toBeGreaterThanOrEqual(4);
    expect(ab.every((t) => t.styles?.includes(FightingStyle.AimedBlow))).toBe(true);
    // a Wall-of-Steel trait must not appear
    expect(ab.some((t) => t.id === 'living_wall')).toBe(false);
  });

  it('traitsByTier filters by tier', () => {
    const flaws = traitsByTier('Flaw');
    expect(flaws.length).toBeGreaterThanOrEqual(10);
    expect(flaws.every((t) => t.sign === 'negative')).toBe(true);
  });
});
