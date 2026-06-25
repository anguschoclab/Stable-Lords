import { describe, it, expect, vi } from 'vitest';
import { computeHitDamage, calculateKillWindow } from '@/engine/combat/mechanics/damageCalc';
import { KILL_WINDOW_ENDURANCE } from '@/constants/combat';

describe('damageCalc', () => {
  describe('computeHitDamage', () => {
    it('computes minimum damage with 0 rng', () => {
      const rng = vi.fn().mockReturnValue(0.0); // Variance = 0.7
      // damageClass = 10, location = 'left arm' (mult 1.2)
      // base = 10 + 4 = 14
      // variance = 0.7
      // 14 * 1.2 * 0.7 = 11.76 -> 12
      expect(computeHitDamage(rng, 10, 'chest')).toBe(12);
    });

    it('computes maximum damage with 1 rng', () => {
      const rng = vi.fn().mockReturnValue(1.0); // Variance = 1.3
      // damageClass = 10, location = 'left arm' (mult 1.2)
      // base = 10 + 4 = 14
      // variance = 1.3
      // 14 * 1.2 * 1.3 = 21.84 -> 22
      expect(computeHitDamage(rng, 10, 'chest')).toBe(22);
    });

    it('clamps damage to minimum 1', () => {
      const rng = vi.fn().mockReturnValue(0.0);
      // damageClass = -20, location = 'left arm'
      // base = -20 + 4 = -16
      expect(computeHitDamage(rng, -20, 'chest')).toBe(1);
    });

    it('falls back to 1.0 locMult if location missing in LOCATION_DAMAGE_MULT', () => {
      const rng = vi.fn().mockReturnValue(0.5); // Variance = 1.0
      // damageClass = 10
      // base = 14
      // 14 * 1.0 * 1.0 = 14
      expect(computeHitDamage(rng, 10, 'unknown' as any)).toBe(14);
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
      // momentum = 0, hpRatio = 1.0, endRatio = 1.0, killDesire = 0, loc = 'left arm' (0.1 mult)
      // threshold starts at 0.012 * 0.1 = 0.0012
      // killDesire = 0 -> (0-5) * 0.002 = -0.01
      // threshold = 0.0012 - 0.01 = -0.0088 -> 0
      expect(
        calculateKillWindow(
          1.0, 1.0, 'left arm', 0, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBe(0);
    });

    it('adds hpRatio modifiers', () => {
      // base = 0.012
      // hpRatio < 0.3 (+0.004) = 0.016
      expect(
        calculateKillWindow(
          0.2, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          0.4, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );

      // hpRatio < 0.5 (+0.001) = 0.013
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
      // < 0.2 (+0.006)
      expect(
        calculateKillWindow(
          1.0, 0.1, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          1.0, KILL_WINDOW_ENDURANCE - 0.01, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );

      // < KILL_WINDOW_ENDURANCE (+0.003)
      expect(
        calculateKillWindow(
          1.0, KILL_WINDOW_ENDURANCE - 0.01, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          1.0, 0.5, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );

      // < 0.6 (+0.001)
      expect(
        calculateKillWindow(
          1.0, 0.5, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      ).toBeGreaterThan(
        calculateKillWindow(
          1.0, 0.7, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0
        )
      );
    });

    it('incorporates various bonuses (killDesire, momentum, specialtyBonus)', () => {
      calculateKillWindow(
          1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0); // 0.012 * 3.5 = 0.042 -> 0.04 (clamp)

      // Need a smaller base to see the effect
      calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0); // 0.012 * 0.1 = 0.0012

      // Momentum 2 (+0.004)
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 2, 0, 0)
      ).toBeCloseTo(0.0052, 5);

      // Momentum 3 (+0.0075)
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 3, 0, 0)
      ).toBeCloseTo(0.0087, 5);

      // specialtyBonus
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0.005, 0)
      ).toBeCloseTo(0.0062, 5);

      // crowdKillBonus
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0.005)
      ).toBeCloseTo(0.0062, 5);
    });

    it('incorporates attOE, attAL, matchupBonus, decSkill, phaseLevel', () => {
      calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0); // 0.0012

      // attOE + attAL > 10
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 10, 5, 0, 10, 0, 0, 0)
      ).toBeCloseTo(0.00245, 5);

      // matchupBonus
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 5, 10, 0, 0, 0)
      ).toBeCloseTo(0.0062, 5);

      // decSkill > 10
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 20, 0, 0, 0)
      ).toBeCloseTo(0.0042, 5);

      // phaseLevel
      expect(
        calculateKillWindow(1.0, 1.0, 'left arm', 5, 2, 5, 5, 0, 10, 0, 0, 0)
      ).toBeCloseTo(0.0042, 5);
    });

    it('falls back to 1.0 locMult if location missing in LOCATION_KILL_MULT', () => {
      // unknown location, 0.012 * 1.0 = 0.012
      expect(
        calculateKillWindow(1.0, 1.0, 'unknown' as any, 5, 0, 5, 5, 0, 10, 0, 0, 0)
      ).toBe(0.012);
    });

    it('clamps to max 0.04', () => {
      // head (locMult = 6.0)
      // 0.012 * 6.0 = 0.072 -> max 0.04
      expect(
        calculateKillWindow(1.0, 1.0, 'head', 5, 0, 5, 5, 0, 10, 0, 0, 0)
      ).toBe(0.04);
    });
  });
});
