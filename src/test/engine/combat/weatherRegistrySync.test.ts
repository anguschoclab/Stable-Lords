/**
 * Weather registry sync — cross-cutting test verifying all weather registries
 * are synchronized after merging PR #747 (Cosmic Anomaly).
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_TYPES } from '@/types/enumSources';
import { WeatherTypeSchema } from '@/schemas/gameStateSchema';
import { getWeatherEffect, weatherOpeningLine } from '@/engine/combat/mechanics/weatherEffects';
import { WEATHER_CONFIG, WEATHER_PENALTIES } from '@/constants/arena/weather';
import { STYLE_WEATHER_MODIFIERS } from '@/constants/arena/arena';

describe('weather registry synchronization', () => {
  it('WEATHER_TYPES has no duplicates', () => {
    expect(new Set(WEATHER_TYPES).size).toBe(WEATHER_TYPES.length);
  });

  it('WeatherTypeSchema has no duplicates', () => {
    const options = WeatherTypeSchema.options as string[];
    expect(new Set(options).size).toBe(options.length);
  });

  it('WEATHER_TYPES matches WeatherTypeSchema', () => {
    const weatherSet = new Set(WEATHER_TYPES as readonly string[]);
    const schemaSet = new Set(WeatherTypeSchema.options as string[]);
    expect(weatherSet).toEqual(schemaSet);
  });

  it('getWeatherEffect covers every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      const effect = getWeatherEffect(w as any);
      expect(effect).toBeDefined();
      expect(typeof effect.staminaMult).toBe('number');
      expect(typeof effect.initiativeMod).toBe('number');
      expect(typeof effect.riposteMod).toBe('number');
      expect(typeof effect.damageMult).toBe('number');
      expect(typeof effect.description).toBe('string');
    }
  });

  it('weatherOpeningLine covers every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      const line = weatherOpeningLine(w as any);
      expect(line === null || typeof line === 'string').toBe(true);
    }
  });

  it('WEATHER_CONFIG covers every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      expect(WEATHER_CONFIG).toHaveProperty(w);
    }
  });

  it('WEATHER_PENALTIES constants are all numbers', () => {
    for (const [, value] of Object.entries(WEATHER_PENALTIES)) {
      expect(typeof value).toBe('number');
    }
  });

  it('STYLE_WEATHER_MODIFIERS keys use valid weather types', () => {
    const weatherSet = new Set(WEATHER_TYPES as readonly string[]);
    for (const key of Object.keys(STYLE_WEATHER_MODIFIERS)) {
      // Keys are either "Weather:Style" or "tag:Weather"
      const parts = key.split(':');
      if (parts.length === 2) {
        // Check if the weather part is a valid weather type
        // (either first or second part could be weather depending on format)
        const [first = '', second = ''] = parts;
        const isFirstWeather = weatherSet.has(first);
        const isSecondWeather = weatherSet.has(second);
        // At least one part should be a weather type (for style:weather or tag:weather)
        // Tag+weather combos like "cursed:Blood Moon" are also valid
        expect(
          isFirstWeather ||
            isSecondWeather ||
            first === 'cursed' ||
            first === 'water' ||
            first === 'uneven' ||
            first === 'magical' ||
            first === 'living'
        ).toBe(true);
      }
    }
  });
});
