import { describe, it, expect, vi } from 'vitest';
import { skillCheck, contestCheck } from '@/engine/combat/mechanics/combatMath';



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


  describe('contestCheck', () => {
    it('returns true if rollA > rollD', () => {
      const rng = vi
        .fn()
        .mockReturnValueOnce(0.99) // rollA = 20
        .mockReturnValueOnce(0.0); // rollD = 1
      expect(contestCheck(rng, 10, 10)).toBe(true);
    });
    it('returns false if rollA <= rollD', () => {
      const rng = vi
        .fn()
        .mockReturnValueOnce(0.0) // rollA = 1
        .mockReturnValueOnce(0.99); // rollD = 20
      expect(contestCheck(rng, 10, 10)).toBe(false);
    });
    it('handles equal stats with tie (returns false)', () => {
      const rng = vi
        .fn()
        .mockReturnValueOnce(0.5) // rollA = 11
        .mockReturnValueOnce(0.5); // rollD = 11
      expect(contestCheck(rng, 10, 10)).toBe(false);
    });
    it('incorporates modifiers correctly', () => {
      const rng = vi
        .fn()
        .mockReturnValueOnce(0.5) // rollA = 11 + 5 = 16
        .mockReturnValueOnce(0.5); // rollD = 11 + 5 = 16
      expect(contestCheck(rng, 5, 10, 5, -5)).toBe(true); // 11+5+5=21 vs 11+10-5=16 -> 21 > 16 -> true
    });
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

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

describe('Combat Math Mechanics', () => {

  describe('skillCheck', () => {
    it('succeeds on a natural 1 regardless of target', () => {
      const rng = vi.fn().mockReturnValue(0); // Math.floor(0 * 20) + 1 = 1
      expect(skillCheck(rng, -100)).toBe(true);
    });

    it('fails on a natural 20 regardless of target', () => {
      const rng = vi.fn().mockReturnValue(0.99); // Math.floor(0.99 * 20) + 1 = 20
      expect(skillCheck(rng, 100)).toBe(false);
    });

    it('succeeds if roll <= target', () => {
      const rng = vi.fn().mockReturnValue(0.49); // roll = 10
      expect(skillCheck(rng, 10)).toBe(true); // target = clamp(10, 1, 19) = 10. 10 <= 10 -> true
    });

    it('fails if roll > target', () => {
      const rng = vi.fn().mockReturnValue(0.5); // roll = 11
      expect(skillCheck(rng, 10)).toBe(false); // target = 10. 11 <= 10 -> false
    });

    it('applies modifiers to target correctly', () => {
      const rng = vi.fn().mockReturnValue(0.5); // roll = 11
      // base skill 10, mod 1 -> target 11. 11 <= 11 -> true
      expect(skillCheck(rng, 10, 1)).toBe(true);
      // base skill 10, mod -1 -> target 9. 11 <= 9 -> false
      expect(skillCheck(rng, 10, -1)).toBe(false);
    });
  });

  describe('contestCheck', () => {
    it('returns true if A rolls higher than D', () => {
      let callCount = 0;
      const rng = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0.9 : 0.1; // A rolls 19, D rolls 3
      });
      // A: 19 + 5 = 24. D: 3 + 5 = 8.
      expect(contestCheck(rng, 5, 5)).toBe(true);
    });

    it('returns false if D rolls higher than or equal to A', () => {
      let callCount = 0;
      const rng = vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0.1 : 0.9; // A rolls 3, D rolls 19
      });
      // A: 3 + 5 = 8. D: 19 + 5 = 24.
      expect(contestCheck(rng, 5, 5)).toBe(false);
    });

    it('applies modifiers to rolls correctly', () => {
      const rng = vi.fn().mockImplementation(() => 0.5); // Both roll 11
      // A: 11 + 5 + 2 = 18. D: 11 + 5 + 0 = 16.
      expect(contestCheck(rng, 5, 5, 2, 0)).toBe(true);

      // A: 11 + 5 + 0 = 16. D: 11 + 5 + 2 = 18.
      expect(contestCheck(rng, 5, 5, 0, 2)).toBe(false);
    });

    it('fails if there is a tie', () => {
      const rng = vi.fn().mockReturnValue(0.5); // both roll 11
      // A: 11 + 5 = 16. D: 11 + 5 = 16.
      expect(contestCheck(rng, 5, 5)).toBe(false);
    });
  });
});
