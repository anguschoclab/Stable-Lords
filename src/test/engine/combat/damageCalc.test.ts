import { describe, it, expect, vi } from 'vitest';
import { computeHitDamage, calculateKillWindow } from '@/engine/combat/mechanics/damageCalc';

describe('damageCalc mechanics', () => {
  describe('computeHitDamage', () => {
    // base = damageClass + 4 (DAMAGE_BASE_MIN)
    // variance is between 0.7 and 1.3
    // head mult = 1.5, chest mult = 1.2

    it('calculates damage correctly for minimum variance', () => {
      const minRng = vi.fn().mockReturnValue(0.0);
      // damageClass = 10 -> base = 14
      // target = 'head' -> mult = 1.5 -> 21
      // variance = 0.7 -> 14.7 -> round -> 15
      expect(computeHitDamage(minRng, 10, 'head')).toBe(15);
    });

    it('calculates damage correctly for maximum variance', () => {
      const maxRng = vi.fn().mockReturnValue(1.0);
      // damageClass = 10 -> base = 14
      // target = 'chest' -> mult = 1.2 -> 16.8
      // variance = 1.3 -> 21.84 -> round -> 22
      expect(computeHitDamage(maxRng, 10, 'chest')).toBe(22);
    });

    it('clamps damage to a minimum of 1', () => {
      const minRng = vi.fn().mockReturnValue(0.0);
      // damageClass = -5 -> base = -1
      // mult = 1.0 (arms)
      // variance = 0.7
      expect(computeHitDamage(minRng, -5, 'left arm')).toBe(1);
    });

    it('uses 1.0 multiplier for unknown or limb locations', () => {
      const midRng = vi.fn().mockReturnValue(0.5); // variance = 1.0
      // damageClass = 6 -> base = 10
      expect(computeHitDamage(midRng, 6, 'left arm')).toBe(10);
      expect(computeHitDamage(midRng, 6, 'right leg')).toBe(10);
    });
  });

  describe('calculateKillWindow', () => {
    it('returns 0 if momentum is negative', () => {
      expect(calculateKillWindow(0.5, 0.5, 'chest', 5, 1, 5, 5, 0, 10, -1)).toBe(0);
    });

    it('applies modifiers and boundary thresholds correctly', () => {
      // Base threshold = 0.012
      // hpRatio < 0.3 (+0.004) -> hpRatio = 0.2
      // enduranceRatio < 0.2 (+0.006) -> enduranceRatio = 0.1
      // total before location = 0.022
      // location = 'head' (mult = 6.0) -> 0.132
      // attOE + attAL = 20 -> (20 - 10) * 0.00025 = +0.0025
      // matchupBonus = 2 -> 2 * 0.001 = +0.002
      // killDesire = 10 -> (10 - 5) * 0.002 = +0.01
      // decSkill = 15 -> (15 - 10) * 0.0003 = +0.0015
      // phaseLevel = 2 -> 2 * 0.0015 = +0.003
      // momentum = 3 -> +0.0075
      // spec/crowd = 0, 0
      // Expected total: 0.132 + 0.0025 + 0.002 + 0.01 + 0.0015 + 0.003 + 0.0075 = 0.1585
      // But clamped to 0.04
      const win = calculateKillWindow(0.2, 0.1, 'head', 10, 2, 10, 10, 2, 15, 3);
      expect(win).toBe(0.04);
    });

    it('calculates properly for lower boundary cases without hitting max clamp', () => {
      // Base threshold = 0.012
      // hpRatio = 0.8 (no bonus)
      // enduranceRatio = 0.8 (no bonus)
      // total before location = 0.012
      // location = 'chest' (mult = 3.5) -> 0.042
      // Wait, location kill mult for chest is 3.5. So 0.012 * 3.5 = 0.042
      // Already over 0.04. Let's use left arm (mult = 0.1).
      // Base threshold = 0.012
      // location = 'left arm' (mult = 0.1) -> 0.0012
      // attOE + attAL = 10 (0 bonus)
      // matchupBonus = 0
      // killDesire = 5 (0 bonus)
      // decSkill = 10 (0 bonus)
      // phaseLevel = 1 (+0.0015)
      // momentum = 0
      // spec = 0, crowd = 0
      // Expected total: 0.0012 + 0.0015 = 0.0027
      const win = calculateKillWindow(0.8, 0.8, 'left arm', 5, 1, 5, 5, 0, 10, 0);
      expect(win).toBeCloseTo(0.0027, 4);
    });

    it('applies specialty and crowd kill bonuses', () => {
      const win = calculateKillWindow(0.8, 0.8, 'left arm', 5, 1, 5, 5, 0, 10, 0, 0.01, 0.01);
      // From previous test base was 0.0027
      // Adding 0.01 + 0.01 = +0.02
      // Total = 0.0227
      expect(win).toBeCloseTo(0.0227, 4);
    });

    it('handles negative thresholds by clamping to 0', () => {
      // A very low killDesire (1) = (1 - 5) * 0.002 = -0.008
      // Low OE/AL (1,1) = (2 - 10) * 0.00025 = -0.002
      // Base = 0.012 * 0.1 (arm) = 0.0012
      // Phase = 0
      // Expected = 0.0012 - 0.008 - 0.002 = -0.0088
      // Clamped to 0
      const win = calculateKillWindow(0.8, 0.8, 'left arm', 1, 0, 1, 1, 0, 10, 0);
      expect(win).toBe(0);
    });
  });
});
