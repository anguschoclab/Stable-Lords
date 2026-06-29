import { describe, it, expect, vi } from 'vitest';
import { skillCheck, getPhase, pickText, contestCheck } from '@/engine/combat/mechanics/combatMath';

describe('combatMath engine', () => {
  describe('skillCheck', () => {
    it('auto-succeeds on a natural 1 (rng = 0), regardless of low skill', () => {
      const rng = vi.fn().mockReturnValue(0.0);
      expect(skillCheck(rng, -10)).toBe(true);
    });
    it('auto-fails on a natural 20 (rng = 0.99), regardless of high skill', () => {
      const rng = vi.fn().mockReturnValue(0.99);
      expect(skillCheck(rng, 100)).toBe(false);
    });
    it('succeeds when roll is <= target', () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 12)).toBe(true);
    });
    it('fails when roll is > target', () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 8)).toBe(false);
    });
    it('clamps target between 1 and 19', () => {
      const rngUpper = vi.fn().mockReturnValue(0.94);
      expect(skillCheck(rngUpper, 100)).toBe(true);
      const rngLower = vi.fn().mockReturnValue(0.06);
      expect(skillCheck(rngLower, -10)).toBe(false);
    });
    it('incorporates modifier correctly', () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 8, 2)).toBe(true);
      expect(skillCheck(rng, 12, -3)).toBe(false);
    });
    it('handles fractional skill levels by flooring', () => {
      const rng = vi.fn().mockReturnValue(0.45);
      expect(skillCheck(rng, 10.9)).toBe(true);
      expect(skillCheck(rng, 9.9)).toBe(false);
    });
  });

  describe('getPhase', () => {
    it("returns 'opening' when maxExchanges is 0 or negative", () => {
      expect(getPhase(5, 0)).toBe('opening');
      expect(getPhase(5, -5)).toBe('opening');
    });
    it("returns 'opening' when exchange is negative", () => {
      expect(getPhase(-2, 10)).toBe('opening');
    });
    it("returns 'late' when exchange is greater than maxExchanges", () => {
      expect(getPhase(15, 10)).toBe('late');
    });
    it("returns 'opening' when ratio is exactly the threshold (0.25)", () => {
      expect(getPhase(2.5, 10)).toBe('opening');
    });
    it("returns 'opening' when ratio is below the threshold (< 0.25)", () => {
      expect(getPhase(2, 10)).toBe('opening');
      expect(getPhase(0, 10)).toBe('opening');
    });
    it("returns 'mid' when ratio is exactly the mid threshold (0.65)", () => {
      expect(getPhase(6.5, 10)).toBe('mid');
    });
    it("returns 'mid' when ratio is between opening and mid thresholds", () => {
      expect(getPhase(3, 10)).toBe('mid');
      expect(getPhase(5, 10)).toBe('mid');
    });
    it("returns 'late' when ratio is above the mid threshold (> 0.65)", () => {
      expect(getPhase(7, 10)).toBe('late');
      expect(getPhase(10, 10)).toBe('late');
    });
  });
  describe('pickText', () => {
    it('returns empty string when array is empty', () => {
      const rng = vi.fn().mockReturnValue(0.5);
      expect(pickText(rng, [])).toBe('');
    });
    it('returns element based on rng', () => {
      const texts = ['a', 'b', 'c'];
      let rng = vi.fn().mockReturnValue(0);
      expect(pickText(rng, texts)).toBe('a');
      rng = vi.fn().mockReturnValue(0.99);
      expect(pickText(rng, texts)).toBe('c');
      rng = vi.fn().mockReturnValue(0.4);
      expect(pickText(rng, texts)).toBe('b');
    });
    it('returns empty string when array contains undefined', () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // @ts-expect-error testing invalid input
      expect(pickText(rng, [undefined])).toBe('');
    });
  });

  describe('contestCheck', () => {
    it('returns true if rollA > rollD', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.99) // rollA = 20
        .mockReturnValueOnce(0.0); // rollD = 1
      expect(contestCheck(rng, 10, 10)).toBe(true);
    });
    it('returns false if rollA <= rollD', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.0) // rollA = 1
        .mockReturnValueOnce(0.99); // rollD = 20
      expect(contestCheck(rng, 10, 10)).toBe(false);
    });
    it('handles equal stats with tie (returns false)', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.5) // rollA = 11
        .mockReturnValueOnce(0.5); // rollD = 11
      expect(contestCheck(rng, 10, 10)).toBe(false);
    });
    it('incorporates modifiers correctly', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.5) // rollA = 11 + 5 = 16
        .mockReturnValueOnce(0.5); // rollD = 11 + 5 = 16
      expect(contestCheck(rng, 5, 10, 5, -5)).toBe(true); // 11+5+5=21 vs 11+10-5=16 -> 21 > 16 -> true
    });
  });

  // ─── Phase 4: Edge cases ─────────────────────────────────────────────────────

  describe('getPhase edge cases', () => {
    it("returns 'opening' for exchange = 0", () => {
      expect(getPhase(0, 10)).toBe('opening');
    });

    it("returns 'late' for maxExchanges = 1 with exchange = 1", () => {
      // ratio = 1/1 = 1.0 > 0.65 → late
      expect(getPhase(1, 1)).toBe('late');
    });
  });

  describe('skillCheck edge cases', () => {
    it('clamps target to 1 when skill = 0 and no modifier', () => {
      // target = max(1, min(19, floor(0) + 0)) = max(1, min(19, 0)) = 1
      // roll = 1 (rng = 0) → auto-success
      const rng = vi.fn().mockReturnValue(0.0);
      expect(skillCheck(rng, 0)).toBe(true);
    });

    it('clamps target to 19 when modifier pushes it above 19', () => {
      // target = max(1, min(19, floor(15) + 10)) = max(1, min(19, 25)) = 19
      // roll = 19 (rng = 0.9) → 19 <= 19 → success
      const rng = vi.fn().mockReturnValue(0.9);
      expect(skillCheck(rng, 15, 10)).toBe(true);
      // roll = 20 (rng = 0.99) → auto-fail
      const rng2 = vi.fn().mockReturnValue(0.99);
      expect(skillCheck(rng2, 15, 10)).toBe(false);
    });
  });
});
