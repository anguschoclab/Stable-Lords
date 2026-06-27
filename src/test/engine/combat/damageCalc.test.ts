import { describe, it, expect, vi } from 'vitest';
import { computeHitDamage, calculateKillWindow } from '@/engine/combat/mechanics/damageCalc';
import { KILL_WINDOW_ENDURANCE } from '@/constants/combat';

describe('damageCalc mechanics', () => {
  describe('computeHitDamage', () => {
    it('computes minimum damage with 0 rng', () => {
      const rng = vi.fn().mockReturnValue(0.0); // Variance = 0.7
      expect(computeHitDamage(rng, 10, 'chest')).toBe(12);
    });

    it('computes maximum damage with 1 rng', () => {
      const rng = vi.fn().mockReturnValue(1.0); // Variance = 1.3
      expect(computeHitDamage(rng, 10, 'chest')).toBe(22);
    });

    it('clamps damage to minimum 1', () => {
      const rng = vi.fn().mockReturnValue(0.0);
      expect(computeHitDamage(rng, -20, 'chest')).toBe(1);
    });

    it('falls back to 1.0 locMult if location missing in LOCATION_DAMAGE_MULT', () => {
      const rng = vi.fn().mockReturnValue(0.5); // Variance = 1.0
      expect(computeHitDamage(rng, 10, 'unknown' as any)).toBe(14);
    });

    it('calculates damage correctly for minimum variance (head)', () => {
      const minRng = vi.fn().mockReturnValue(0.0);
      expect(computeHitDamage(minRng, 10, 'head')).toBe(15);
    });

    it('uses 1.0 multiplier for unknown or limb locations', () => {
      const midRng = vi.fn().mockReturnValue(0.5); // variance = 1.0
      expect(computeHitDamage(midRng, 6, 'left arm')).toBe(10);
      expect(computeHitDamage(midRng, 6, 'right leg')).toBe(10);
    });
  });

  describe('calculateKillWindow', () => {
    it('returns 0 if momentum < 0', () => {
      expect(
        calculateKillWindow(
          1.0, 1.0, 'left arm', 5, 1, 5, 5, 0, 10, -1, 0, 0
        )
      ).toBe(0);
    });

    it('returns 0 if threshold evaluates to < 0', () => {
      expect(
        calculateKillWindow(
          1.0, 1.0, 'left arm', 0, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBe(0);
    });

    it('adds hpRatio modifiers', () => {
      expect(
        calculateKillWindow(
          0.2, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          0.4, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );

      expect(
        calculateKillWindow(
          0.4, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          0.6, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );
    });

    it('adds enduranceRatio modifiers', () => {
      expect(
        calculateKillWindow(
          1.0, 0.1, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          1.0, KILL_WINDOW_ENDURANCE - 0.01, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );

      expect(
        calculateKillWindow(
          1.0, KILL_WINDOW_ENDURANCE - 0.01, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          1.0, 0.5, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );
    });

    it('incorporates various bonuses (killDesire, momentum, specialtyBonus)', () => {
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 2, 0, 0)
      ).toBeCloseTo(0.0052, 5);

      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 3, 0, 0)
      ).toBeCloseTo(0.0087, 5);
    });

    it('incorporates attOE, attAL, matchupBonus, decSkill, phaseLevel', () => {
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 10, 5, 0, 10, 0, 0, 0)
      ).toBeCloseTo(0.00245, 5);

      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 5, 10, 0, 0, 0)
      ).toBeCloseTo(0.0062, 5);
    });

    it('falls back to 1.0 locMult if location missing in LOCATION_KILL_MULT', () => {
      expect(
        calculateKillWindow(1.0, 1.0, 'unknown' as any, 5, 0, 5, 5, 0, 10, 0, 0, 0)
      ).toBe(0.012);
    });

    it('clamps to max 0.04', () => {
      expect(
        calculateKillWindow(1.0, 1.0, 'head', 5, 0, 5, 5, 0, 10, 0, 0, 0)
      ).toBe(0.04);
    });

    it('applies modifiers and boundary thresholds correctly', () => {
      const win = calculateKillWindow(0.2, 0.1, 'head', 10, 2, 10, 10, 2, 15, 3);
      expect(win).toBe(0.04);
    });

    it('calculates properly for lower boundary cases without hitting max clamp', () => {
      const win = calculateKillWindow(0.8, 0.8, 'left arm', 5, 1, 5, 5, 0, 10, 0);
      expect(win).toBeCloseTo(0.0027, 4);
    });

    it('applies specialty and crowd kill bonuses', () => {
      const win = calculateKillWindow(0.8, 0.8, 'left arm', 5, 1, 5, 5, 0, 10, 0, 0.01, 0.01);
      expect(win).toBeCloseTo(0.0227, 4);
    });

    it('handles negative thresholds by clamping to 0', () => {
      const win = calculateKillWindow(0.8, 0.8, 'left arm', 1, 0, 1, 1, 0, 10, 0);
      expect(win).toBe(0);
    });
  });
});
