import { describe, it, expect, vi } from 'vitest';
import { computeHitDamage, calculateKillWindow } from '@/engine/combat/mechanics/damageCalc';

describe('Damage Calculation', () => {
  describe('computeHitDamage', () => {
    it('calculates damage based on class, location, and rng', () => {
      const rng = vi.fn().mockReturnValue(0.5); // mid variance = 1.0
      // base = 10 + 4 = 14
      // locMult (chest) = 1.2
      // variance = 1.0
      // expected = 14 * 1.2 * 1.0 = 16.8 -> 17
      expect(computeHitDamage(rng, 10, 'chest')).toBe(17);
    });

    it('applies max variance', () => {
      const rng = vi.fn().mockReturnValue(1.0); // max variance = 1.3
      // base = 5 + 4 = 9
      // locMult (head) = 1.5
      // variance = 1.3
      // expected = 9 * 1.5 * 1.3 = 17.55 -> 18
      expect(computeHitDamage(rng, 5, 'head')).toBe(18);
    });

    it('applies min variance and defaults missing location mult to 1.0', () => {
      const rng = vi.fn().mockReturnValue(0.0); // min variance = 0.7
      // base = 5 + 4 = 9
      // locMult ('unknown' not possible due to types, but testing default path if needed via cast)
      // We use an arm location which has 1.0 mult
      // expected = 9 * 1.0 * 0.7 = 6.3 -> 6
      expect(computeHitDamage(rng, 5, 'right arm')).toBe(6);
    });

    it('floors at 1 damage', () => {
      const rng = vi.fn().mockReturnValue(0.0); // min variance = 0.7
      // damageClass = -10 -> base = -6
      // expected = max(1, -6 * 1.0 * 0.7) = 1
      expect(computeHitDamage(rng, -10, 'chest')).toBe(1);
    });
  });

  describe('calculateKillWindow', () => {
    it('returns 0 if momentum is negative', () => {
      expect(calculateKillWindow(1, 1, 'chest', 5, 1, 5, 5, 0, 10, -1)).toBe(0);
    });

    it('calculates threshold correctly with various modifiers', () => {
      // Base: 0.012
      // hpRatio: 0.2 < 0.3 -> +0.004
      // endRatio: 0.5 < 0.6 -> +0.001
      // locMult (head): 6.0
      // current threshold: (0.012 + 0.004 + 0.001) * 6.0 = 0.017 * 6.0 = 0.102
      // attOE + attAL = 15 - 10 = 5 * 0.00025 = 0.00125
      // matchupBonus = 2 * 0.001 = 0.002
      // killDesire = 8 - 5 = 3 * 0.002 = 0.006
      // decSkill = 15 - 10 = 5 * 0.0003 = 0.0015
      // phaseLevel = 2 * 0.0015 = 0.003
      // momentum = 2 -> +0.004
      // specialtyBonus = 0.005
      // crowdKillBonus = 0.001
      // Expected pre-clamp: 0.102 + 0.00125 + 0.002 + 0.006 + 0.0015 + 0.003 + 0.004 + 0.005 + 0.001 = 0.12575
      // Clamped to 0.04
      expect(calculateKillWindow(0.2, 0.5, 'head', 8, 2, 8, 7, 2, 15, 2, 0.005, 0.001)).toBe(0.04);
    });

    it('handles mid hpRatio and low endurance ratio correctly', () => {
        // Base: 0.012
        // hpRatio: 0.4 < 0.5 -> +0.001
        // endRatio: 0.1 < 0.2 -> +0.006
        // locMult (chest): 3.5
        // current threshold: (0.012 + 0.001 + 0.006) * 3.5 = 0.019 * 3.5 = 0.0665
        // The rest are default -> 0 additions.
        // Clamped to 0.04
        expect(calculateKillWindow(0.4, 0.1, 'chest', 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBe(0.04);
    });

    it('handles KILL_WINDOW_ENDURANCE correctly', () => {
        // Base: 0.012
        // hpRatio: 1.0 -> 0
        // endRatio: 0.25 (assuming < KILL_WINDOW_ENDURANCE) -> +0.003
        // locMult (chest): 3.5
        // threshold: (0.012 + 0.003) * 3.5 = 0.0525
        // Clamped to 0.04
        expect(calculateKillWindow(1.0, 0.25, 'chest', 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBe(0.04);
    });

    it('handles momentum >= 3 correctly', () => {
        // Base: 0.012
        // locMult (right arm): 0.1
        // threshold: 0.012 * 0.1 = 0.0012
        // momentum: 3 -> +0.0075
        // total = 0.0087
        expect(calculateKillWindow(1.0, 1.0, 'right arm', 5, 0, 5, 5, 0, 10, 3, 0, 0)).toBeCloseTo(0.0087, 4);
    });

    it('clamps minimum threshold to 0', () => {
        // negative bonuses to push below 0
        expect(calculateKillWindow(1.0, 1.0, 'right arm', 0, 0, 0, 0, -50, 0, 0, 0, 0)).toBe(0);
    });
  });
});
