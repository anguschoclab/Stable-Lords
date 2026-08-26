import { describe, it, expect } from 'vitest';
import { enduranceCost, fatiguePenalty } from '@/engine/combat/mechanics/combatFatigue';
import type { WeatherType } from '@/types/shared.types';

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
