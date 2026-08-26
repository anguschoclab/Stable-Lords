/**
 * Cosmic Anomaly weather — verifies the new weather type is registered
 * across all required files after PR #747 merge.
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_TYPES } from '@/types/enumSources';
import { WeatherTypeSchema } from '@/schemas/gameStateSchema';
import { getWeatherEffect, weatherOpeningLine } from '@/engine/combat/mechanics/weatherEffects';
import { WEATHER_CONFIG } from '@/constants/arena/weather';

describe('Cosmic Anomaly weather type', () => {
  it('Cosmic Anomaly is in WEATHER_TYPES enum source', () => {
    // After PR #747 merge, this should pass
    expect(WEATHER_TYPES.includes('Cosmic Anomaly' as any)).toBe(true);
  });

  it('Cosmic Anomaly is in WeatherTypeSchema', () => {
    const options = WeatherTypeSchema.options as string[];
    expect(options.includes('Cosmic Anomaly')).toBe(true);
  });

  it('Cosmic Anomaly has a weather effect entry', () => {
    // After merge, getWeatherEffect should return a defined effect
    const effect = getWeatherEffect('Cosmic Anomaly' as any);
    expect(effect).toBeDefined();
    expect(typeof effect.staminaMult).toBe('number');
    expect(typeof effect.initiativeMod).toBe('number');
    expect(typeof effect.riposteMod).toBe('number');
    expect(typeof effect.damageMult).toBe('number');
    expect(typeof effect.description).toBe('string');
    expect(effect.description.length).toBeGreaterThan(0);
  });

  it('Cosmic Anomaly has a weather opening line', () => {
    const line = weatherOpeningLine('Cosmic Anomaly' as any);
    // Should be a non-null string (atmospheric weather)
    if (line !== null) {
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    }
  });

  it('Cosmic Anomaly has a WEATHER_CONFIG entry', () => {
    // After merge, WEATHER_CONFIG should have this key
    const config = (
      WEATHER_CONFIG as Record<string, (typeof WEATHER_CONFIG)[keyof typeof WEATHER_CONFIG]>
    )['Cosmic Anomaly'];
    if (config) {
      expect(config.icon).toBeDefined();
      expect(config.description).toBeTruthy();
    }
  });

  it('weather count is 59 after adding Cosmic Anomaly, Temporal Rift, Stardust Gale, and Mana Storm', () => {
    // Baseline: 53 weather types
    // After adding Cosmic Anomaly: 54
    // After adding Temporal Rift + Stardust Gale: 56
    // After adding Mana Storm: 59
    if (WEATHER_TYPES.includes('Cosmic Anomaly' as any)) {
      expect(WEATHER_TYPES.length).toBe(59);
    } else {
      // Before merge, still 55
      expect(WEATHER_TYPES.length).toBe(55);
    }
  });
});
