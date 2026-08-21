import { describe, it, expect } from 'vitest';
import { accumulateBleed, tickBleed } from '@/engine/combat/resolution/bleed';

describe('Bleed Mechanics', () => {
  describe('accumulateBleed', () => {
    it('adds stacks up to the cap (5)', () => {
      // 0 + 2 = 2
      expect(accumulateBleed(0)).toBe(2);
      // 3 + 2 = 5
      expect(accumulateBleed(3)).toBe(5);
      // 4 + 2 = 6, capped to 5
      expect(accumulateBleed(4)).toBe(5);
      // 5 + 2 = 7, capped to 5
      expect(accumulateBleed(5)).toBe(5);
    });
  });

  describe('tickBleed', () => {
    it('calculates damage and decays stacks correctly', () => {
      // 0 stacks -> 0 damage, 0 next
      expect(tickBleed(0)).toEqual({ damage: 0, next: 0 });
      // 2 stacks -> 2*1 damage, 2-1 next
      expect(tickBleed(2)).toEqual({ damage: 2, next: 1 });
      // 5 stacks -> 5*1 damage, 5-1 next
      expect(tickBleed(5)).toEqual({ damage: 5, next: 4 });
    });

    it('prevents next stacks from dropping below zero', () => {
      expect(tickBleed(0).next).toBe(0);
    });
  });
});
