import { describe, it, expect } from 'vitest';
import { accumulateBleed, tickBleed } from '@/engine/combat/resolution/bleed';
import { SL_BLEED_STACKS_PER_HIT, SL_BLEED_CAP, SL_BLEED_TICK_DMG, SL_BLEED_DECAY } from '@/constants/combat/combat';

describe('Bleed Mechanics', () => {
  describe('accumulateBleed', () => {
    it('adds stacks normally when below cap', () => {
      const current = 1;
      const result = accumulateBleed(current);
      expect(result).toBe(current + SL_BLEED_STACKS_PER_HIT);
    });

    it('caps stacks correctly', () => {
      const current = SL_BLEED_CAP - 1;
      const result = accumulateBleed(current);
      expect(result).toBe(SL_BLEED_CAP);
    });

    it('does not exceed cap if already at cap', () => {
      const result = accumulateBleed(SL_BLEED_CAP);
      expect(result).toBe(SL_BLEED_CAP);
    });
  });

  describe('tickBleed', () => {
    it('calculates damage based on current stacks', () => {
      const stacks = 3;
      const { damage } = tickBleed(stacks);
      expect(damage).toBe(stacks * SL_BLEED_TICK_DMG);
    });

    it('decays stacks for next turn', () => {
      const stacks = 3;
      const { next } = tickBleed(stacks);
      expect(next).toBe(stacks - SL_BLEED_DECAY);
    });

    it('does not decay stacks below zero', () => {
      const stacks = 0;
      const { next } = tickBleed(stacks);
      expect(next).toBe(0);
    });

    it('handles negative stacks by flooring at zero for decay', () => {
       const stacks = -2;
       const { next } = tickBleed(stacks);
       expect(next).toBe(0);
    });
  });
});
