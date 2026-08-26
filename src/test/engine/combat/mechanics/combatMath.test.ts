import { describe, it, expect, vi } from 'vitest';
import { pickText, skillCheck, contestCheck } from '@/engine/combat/mechanics/combatMath';

describe('Combat Math Mechanics', () => {
  describe('pickText', () => {
    it('returns empty string if array is empty', () => {
      expect(pickText(() => 0.5, [])).toBe('');
    });

    it('picks element based on rng', () => {
      const texts = ['a', 'b', 'c'];
      expect(pickText(() => 0.1, texts)).toBe('a');
      expect(pickText(() => 0.5, texts)).toBe('b');
      expect(pickText(() => 0.9, texts)).toBe('c');
    });

    it('returns empty string as fallback if undefined', () => {
      // Simulate sparse array
      const arr = new Array(1);
      expect(pickText(() => 0, arr)).toBe('');
    });
  });

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
      let callCount = 0;
      const rng = vi.fn().mockImplementation(() => 0.5); // Both roll 11
      // A: 11 + 5 + 2 = 18. D: 11 + 5 + 0 = 16.
      expect(contestCheck(rng, 5, 5, 2, 0)).toBe(true);

      callCount = 0;
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
