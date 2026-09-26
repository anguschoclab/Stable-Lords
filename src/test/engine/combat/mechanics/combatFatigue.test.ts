import { describe, it, expect } from 'vitest';
import { enduranceCost, fatiguePenalty } from '@/engine/combat/mechanics/combatFatigue';
import type { WeatherType } from '@/types/shared.types';



describe('combatFatigue mechanics', () => {
  describe('enduranceCost', () => {
    it('scales appropriately with OE and AL in Clear weather', () => {
      // ENDURANCE_OE_SCALING = 0.18, ENDURANCE_AL_SCALING = 0.09
      expect(enduranceCost(5, 5)).toBeCloseTo(5 * 0.18 + 5 * 0.09, 2);
      expect(enduranceCost(10, 10, 'Clear')).toBeCloseTo(10 * 0.18 + 10 * 0.09, 2);
      expect(enduranceCost(0, 0, 'Clear')).toBe(0);
    });

    it('multiplies cost correctly for different weather conditions', () => {
      const baseCost = 5 * 0.18 + 5 * 0.09;
      expect(enduranceCost(5, 5, 'Sweltering')).toBeCloseTo(baseCost * 1.3, 2);
      expect(enduranceCost(5, 5, 'Breezy')).toBeCloseTo(baseCost * 0.9, 2);
    });
  });

  describe('fatiguePenalty', () => {
    // FATIGUE_MODERATE_THRESHOLD = 0.45
    // FATIGUE_HEAVY_THRESHOLD = 0.25
    // FATIGUE_MODERATE_PENALTY = -4
    // FATIGUE_HEAVY_PENALTY = -8

    it('returns 0 when endurance ratio is above moderate threshold', () => {
      expect(fatiguePenalty(50, 100)).toBe(0); // 0.50
      expect(fatiguePenalty(100, 100)).toBe(0); // 1.00
    });

    it('returns moderate penalty when ratio is between heavy and moderate thresholds', () => {
      expect(fatiguePenalty(45, 100)).toBe(-4); // 0.45 (equal to threshold)
      expect(fatiguePenalty(30, 100)).toBe(-4); // 0.30
    });

    it('returns heavy penalty when ratio is below heavy threshold', () => {
      expect(fatiguePenalty(25, 100)).toBe(-8); // 0.25 (equal to threshold)
      expect(fatiguePenalty(10, 100)).toBe(-8); // 0.10
      expect(fatiguePenalty(0, 100)).toBe(-8); // 0.00
    });

    it('reduces penalty based on penaltyReduction parameter', () => {
      // Moderate penalty = -4. Reduced by 0.5 = -2
      expect(fatiguePenalty(30, 100, 0.5)).toBe(-2);
      // Heavy penalty = -8. Reduced by 0.5 = -4
      expect(fatiguePenalty(10, 100, 0.5)).toBe(-4);
      // Heavy penalty = -8. Reduced by 0.25 = -6
      expect(fatiguePenalty(10, 100, 0.25)).toBe(-6);

      // Ensures Math.ceil logic works correctly (e.g. -4 * (1-0.2) = -3.2 -> ceil -> -3)
      // Actually -4 * 0.8 = -3.2. Math.ceil(-3.2) is -3.
      expect(fatiguePenalty(30, 100, 0.2)).toBe(-3);
    });

    it('handles zero or negative maxEndurance safely', () => {
      // ratio = endurance / Math.max(1, maxEndurance)
      // if maxEndurance is 0, it uses 1.
      expect(fatiguePenalty(1, 0)).toBe(0); // ratio = 1/1 = 1 > 0.45
      expect(fatiguePenalty(0, 0)).toBe(-8); // ratio = 0/1 = 0 <= 0.25
    });
  });

  // ─── Phase 4: Edge cases ─────────────────────────────────────────────────────

  describe('enduranceCost edge cases', () => {
    it('defaults unknown weather string to Clear (staminaMult = 1.0)', () => {
      const baseCost = 5 * 0.18 + 5 * 0.09;
      expect(enduranceCost(5, 5, 'UnknownWeather')).toBeCloseTo(baseCost, 2);
    });

    it('defaults undefined weather to Clear (staminaMult = 1.0)', () => {
      const baseCost = 5 * 0.18 + 5 * 0.09;
      expect(enduranceCost(5, 5, undefined)).toBeCloseTo(baseCost, 2);
    });
  });

  describe('fatiguePenalty edge cases', () => {
    it('returns 0 when penaltyReduction = 1.0 (full reduction)', () => {
      // base = -8, penaltyReduction = 1.0 → ceil(-8 * (1 - 1.0)) = ceil(-0) = -0
      // Normalize -0 to +0 for comparison
      expect(fatiguePenalty(10, 100, 1.0) + 0).toBe(0);
    });

    it('returns 0 when base penalty is 0 regardless of penaltyReduction', () => {
      // base = 0 (endurance ratio > 0.45), penaltyReduction = 0.5
      // base === 0 → returns base (0) immediately
      expect(fatiguePenalty(50, 100, 0.5)).toBe(0);
    });
  });
});

describe('Combat Fatigue Mechanics', () => {
  describe('enduranceCost', () => {
    it('calculates endurance cost based on OE and AL', () => {
      // OE = 5, AL = 5 -> 5 * 0.18 + 5 * 0.09 = 0.9 + 0.45 = 1.35
      expect(enduranceCost(5, 5)).toBeCloseTo(1.35);
    });

    it('applies weather multiplier', () => {
      // OE = 5, AL = 5 -> 1.35
      // Scorching weather has a staminaMult of 1.25 (assuming based on constants)
      // 1.35 * 1.25 = 1.6875
      const costClear = enduranceCost(5, 5, 'Clear' as WeatherType);
      const costSweltering = enduranceCost(5, 5, 'Sweltering' as WeatherType);
      expect(costSweltering).toBeGreaterThan(costClear);
    });
  });

  describe('fatiguePenalty', () => {
    it('returns 0 penalty when endurance is above moderate threshold (>45%)', () => {
      expect(fatiguePenalty(50, 100)).toBe(0);
      expect(fatiguePenalty(100, 100)).toBe(0);
    });

    it('returns moderate penalty when endurance is between heavy and moderate (25% < x <= 45%)', () => {
      expect(fatiguePenalty(45, 100)).toBe(-4);
      expect(fatiguePenalty(26, 100)).toBe(-4);
    });

    it('returns heavy penalty when endurance is below heavy threshold (<=25%)', () => {
      expect(fatiguePenalty(25, 100)).toBe(-8);
      expect(fatiguePenalty(0, 100)).toBe(-8);
    });

    it('applies penalty reduction correctly using Math.ceil', () => {
      // Moderate penalty is -4. 50% reduction -> -4 * 0.5 = -2
      expect(fatiguePenalty(40, 100, 0.5)).toBe(-2);

      // Heavy penalty is -8. 25% reduction -> -8 * 0.75 = -6
      expect(fatiguePenalty(20, 100, 0.25)).toBe(-6);

      // Reduction leading to fractional -> -8 * (1 - 0.3) = -5.6 -> ceil -> -5
      expect(fatiguePenalty(20, 100, 0.3)).toBe(-5);
    });

    it('handles zero maxEndurance gracefully by returning heavy penalty', () => {
       expect(fatiguePenalty(0, 0)).toBe(-8);
    });
  });
});

describe('combatFatigue engine', () => {
  describe('fatiguePenalty', () => {
    it('returns 0 penalty when endurance is high (> 45%)', () => {
      expect(fatiguePenalty(100, 100)).toBe(0); // 100%
      expect(fatiguePenalty(46, 100)).toBe(0); // 46%
    });

    it('returns -4 moderate penalty when endurance is <= 45% and > 25%', () => {
      expect(fatiguePenalty(45, 100)).toBe(-4); // 45%
      expect(fatiguePenalty(26, 100)).toBe(-4); // 26%
    });

    it('returns -8 heavy penalty when endurance is <= 25%', () => {
      expect(fatiguePenalty(25, 100)).toBe(-8); // 25%
      expect(fatiguePenalty(0, 100)).toBe(-8); // 0%
    });

    it('handles zero or negative maxEndurance gracefully (div by zero prevention)', () => {
      // ratio = endurance / Math.max(1, maxEndurance)
      // endurance 0, max 0 => 0 / 1 => 0 => -8 heavy penalty
      expect(fatiguePenalty(0, 0)).toBe(-8);
      // endurance 1, max 0 => 1 / 1 => 1 => 0 penalty
      expect(fatiguePenalty(1, 0)).toBe(0);
      // endurance 0, max -10 => 0 / 1 => 0 => -8 heavy penalty
      expect(fatiguePenalty(0, -10)).toBe(-8);
    });
  });

  describe('enduranceCost', () => {
    // Tuned 2026-04: scaling raised from 0.10/0.05 to 0.18/0.09, and the
    // internal Math.floor was removed so callers (applyEnduranceCosts) can
    // round once after all multipliers. Prior values + floor truncated most
    // OE/AL combos to 0 endurance/exchange — fatigue was effectively dead.
    it('calculates cost based on OE (0.18) + AL (0.09) without internal floor', () => {
      // 10 * 0.18 + 10 * 0.09 = 1.8 + 0.9 = 2.7
      expect(enduranceCost(10, 10)).toBeCloseTo(2.7);
      // 5 * 0.18 + 5 * 0.09 = 0.9 + 0.45 = 1.35 (was 0 under prior floor)
      expect(enduranceCost(5, 5)).toBeCloseTo(1.35);
      // 8 * 0.18 + 8 * 0.09 = 1.44 + 0.72 = 2.16
      expect(enduranceCost(8, 8)).toBeCloseTo(2.16);
    });

    it('returns 0 if inputs are 0', () => {
      expect(enduranceCost(0, 0)).toBe(0);
    });
  });
});
