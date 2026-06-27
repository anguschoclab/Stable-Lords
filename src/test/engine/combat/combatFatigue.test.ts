import { describe, it, expect, vi } from 'vitest';
import { enduranceCost, fatiguePenalty } from '@/engine/combat/mechanics/combatFatigue';
import { WeatherType } from '@/types/shared.types';

vi.mock('@/engine/combat/mechanics/weatherEffects', () => ({
  getWeatherEffect: vi.fn((weather: WeatherType | string) => {
    if (weather === 'Clear') return { staminaMult: 1.0 };
    if (weather === 'Sweltering') return { staminaMult: 1.3 };
    if (weather === 'Breezy') return { staminaMult: 0.9 };
    return { staminaMult: 1.0 };
  }),
}));

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
});
