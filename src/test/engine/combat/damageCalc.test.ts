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
      expect(calculateKillWindow(1.0, 1.0, 'left arm', 5, 1, 5, 5, 0, 10, -1, 0, 0)).toBe(0);
    });

    it('returns 0 if threshold evaluates to < 0', () => {
      expect(calculateKillWindow(1.0, 1.0, 'left arm', 0, 0, 5, 5, 0, 10, 0, 0, 0)).toBe(0);
    });

    it('adds hpRatio modifiers', () => {
      expect(calculateKillWindow(0.2, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBeGreaterThan(
        calculateKillWindow(0.4, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0)
      );

      expect(calculateKillWindow(0.4, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBeGreaterThan(
        calculateKillWindow(0.6, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0)
      );
    });

    it('adds enduranceRatio modifiers', () => {
      expect(calculateKillWindow(1.0, 0.1, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBeGreaterThan(
        calculateKillWindow(
          1.0,
          KILL_WINDOW_ENDURANCE - 0.01,
          'left arm',
          5,
          0,
          5,
          5,
          0,
          10,
          0,
          0,
          0
        )
      );

      expect(
        calculateKillWindow(
          1.0,
          KILL_WINDOW_ENDURANCE - 0.01,
          'left arm',
          5,
          0,
          5,
          5,
          0,
          10,
          0,
          0,
          0
        )
      ).toBeGreaterThan(calculateKillWindow(1.0, 0.5, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0));
    });

    it('incorporates various bonuses (killDesire, momentum, specialtyBonus)', () => {
      expect(calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 2, 0, 0)).toBeCloseTo(
        0.0052,
        5
      );

      expect(calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 3, 0, 0)).toBeCloseTo(
        0.0087,
        5
      );
    });

    it('incorporates attOE, attAL, matchupBonus, decSkill, phaseLevel', () => {
      expect(calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 10, 5, 0, 10, 0, 0, 0)).toBeCloseTo(
        0.00245,
        5
      );

      expect(calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 5, 10, 0, 0, 0)).toBeCloseTo(
        0.0062,
        5
      );
    });

    it('falls back to 1.0 locMult if location missing in LOCATION_KILL_MULT', () => {
      expect(calculateKillWindow(1.0, 1.0, 'unknown' as any, 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBe(
        0.012
      );
    });

    it('clamps to max 0.04', () => {
      expect(calculateKillWindow(1.0, 1.0, 'head', 5, 0, 5, 5, 0, 10, 0, 0, 0)).toBe(0.04);
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

  // ─── Phase 4: Edge cases & boundary tests ────────────────────────────────────

  describe('computeHitDamage edge cases', () => {
    it('computes damage correctly for damageClass = 0', () => {
      const rng = vi.fn().mockReturnValue(0.0); // Variance = 0.7
      // base = 0 + 4 = 4, chest mult = 1.2, variance = 0.7 → round(4 * 1.2 * 0.7) = round(3.36) = 3
      expect(computeHitDamage(rng, 0, 'chest')).toBe(3);
    });

    it('computes damage correctly for abdomen location (mult = 1.1)', () => {
      const rng = vi.fn().mockReturnValue(0.0); // Variance = 0.7
      // base = 10 + 4 = 14, abdomen mult = 1.1, variance = 0.7 → round(14 * 1.1 * 0.7) = round(10.78) = 11
      expect(computeHitDamage(rng, 10, 'abdomen')).toBe(11);
    });

    it('computes damage correctly for all 7 HitLocation values', () => {
      const rng = vi.fn().mockReturnValue(0.5); // Variance = 1.0
      // base = 10 + 4 = 14, variance = 1.0 → round(14 * locMult * 1.0)
      expect(computeHitDamage(rng, 10, 'head')).toBe(21); // 1.5
      expect(computeHitDamage(rng, 10, 'chest')).toBe(17); // 1.2
      expect(computeHitDamage(rng, 10, 'abdomen')).toBe(15); // 1.1
      expect(computeHitDamage(rng, 10, 'right arm')).toBe(14); // 1.0
      expect(computeHitDamage(rng, 10, 'left arm')).toBe(14); // 1.0
      expect(computeHitDamage(rng, 10, 'right leg')).toBe(14); // 1.0
      expect(computeHitDamage(rng, 10, 'left leg')).toBe(14); // 1.0
    });

    it('scales linearly with high damageClass = 50', () => {
      const rng = vi.fn().mockReturnValue(0.5); // Variance = 1.0
      // base = 50 + 4 = 54, chest mult = 1.2, variance = 1.0 → round(54 * 1.2 * 1.0) = round(64.8) = 65
      expect(computeHitDamage(rng, 50, 'chest')).toBe(65);
    });
  });

  describe('calculateKillWindow edge cases', () => {
    it('does not add momentum tier bonus when momentum = 0', () => {
      const base = calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // momentum = 0: no tier bonus, threshold = 0.012 * 0.1 = 0.0012
      expect(base).toBeCloseTo(0.0012, 5);
    });

    it('does not add momentum tier bonus when momentum = 1 (below tier 2)', () => {
      const win = calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 1, 0, 0);
      // momentum = 1: no tier bonus (tier 2 starts at momentum >= 2)
      expect(win).toBeCloseTo(0.0012, 5);
    });

    it('adds tier 2 bonus when momentum = 2', () => {
      const win = calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 2, 0, 0);
      // momentum = 2: +0.004 → 0.0012 + 0.004 = 0.0052
      expect(win).toBeCloseTo(0.0052, 5);
    });

    it('adds tier 3 bonus when momentum = 3', () => {
      const win = calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 3, 0, 0);
      // momentum = 3: +0.0075 → 0.0012 + 0.0075 = 0.0087
      expect(win).toBeCloseTo(0.0087, 5);
    });

    it('tests hpRatio at exact 0.3 boundary (not < 0.3, falls to < 0.5 tier)', () => {
      const win = calculateKillWindow(0.3, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // hpRatio = 0.3: not < 0.3, but < 0.5 → +0.001
      // threshold = (0.012 + 0.001) * 0.1 = 0.0013
      expect(win).toBeCloseTo(0.0013, 5);
    });

    it('tests hpRatio at exact 0.5 boundary (not < 0.5, no hp bonus)', () => {
      const win = calculateKillWindow(0.5, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // hpRatio = 0.5: not < 0.3, not < 0.5 → no hp bonus
      // threshold = 0.012 * 0.1 = 0.0012
      expect(win).toBeCloseTo(0.0012, 5);
    });

    it('tests enduranceRatio at exact 0.2 boundary (not < 0.2, falls to < KILL_WINDOW_ENDURANCE tier)', () => {
      const win = calculateKillWindow(1.0, 0.2, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // enduranceRatio = 0.2: not < 0.2, but < 0.4 (KILL_WINDOW_ENDURANCE) → +0.003
      // threshold = (0.012 + 0.003) * 0.1 = 0.0015
      expect(win).toBeCloseTo(0.0015, 5);
    });

    it('tests enduranceRatio at exact KILL_WINDOW_ENDURANCE (0.4) boundary', () => {
      const win = calculateKillWindow(1.0, 0.4, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // enduranceRatio = 0.4: not < 0.2, not < 0.4, but < 0.6 → +0.001
      // threshold = (0.012 + 0.001) * 0.1 = 0.0013
      expect(win).toBeCloseTo(0.0013, 5);
    });

    it('tests enduranceRatio at exact 0.6 boundary (not < 0.6, no endurance bonus)', () => {
      const win = calculateKillWindow(1.0, 0.6, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // enduranceRatio = 0.6: no endurance bonus
      // threshold = 0.012 * 0.1 = 0.0012
      expect(win).toBeCloseTo(0.0012, 5);
    });

    it('applies chest kill multiplier (3.5)', () => {
      const win = calculateKillWindow(1.0, 1.0, 'chest', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // threshold = 0.012 * 3.5 = 0.042 → clamped to 0.04
      expect(win).toBe(0.04);
    });

    it('applies abdomen kill multiplier (3.5)', () => {
      const win = calculateKillWindow(1.0, 1.0, 'abdomen', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      // threshold = 0.012 * 3.5 = 0.042 → clamped to 0.04
      expect(win).toBe(0.04);
    });

    it('applies crowdKillBonus in isolation', () => {
      const base = calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0);
      const withCrowd = calculateKillWindow(1.0, 1.0, 'left arm', 5, 0, 5, 5, 0, 10, 0, 0, 0.005);
      expect(withCrowd - base).toBeCloseTo(0.005, 5);
    });
  });
});
