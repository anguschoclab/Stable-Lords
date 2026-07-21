/**
 * Weather type completeness — verifies all weather registries are in sync
 * and have no duplicates. Pre-existing duplicate 'Eldritch Eclipse' in
 * enumSourcesSync.test.ts and 'Moonlight Duel' in shared.types.ts are
 * detected here.
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_TYPES } from '@/types/enumSources';
import { WeatherTypeSchema } from '@/schemas/gameStateSchema';
import { getWeatherEffect, weatherOpeningLine } from '@/engine/combat/mechanics/weatherEffects';
import { WEATHER_CONFIG } from '@/constants/arena/weather';

describe('weather type registry completeness', () => {
  const schemaOptions = WeatherTypeSchema.options as string[];

  it('WEATHER_TYPES has no duplicates', () => {
    expect(new Set(WEATHER_TYPES).size).toBe(WEATHER_TYPES.length);
  });

  it('WeatherTypeSchema has no duplicates', () => {
    expect(new Set(schemaOptions).size).toBe(schemaOptions.length);
  });

  it('WEATHER_TYPES matches WeatherTypeSchema entries', () => {
    const weatherSet = new Set(WEATHER_TYPES as string[]);
    const schemaSet = new Set(schemaOptions);
    expect(weatherSet).toEqual(schemaSet);
  });

  it('getWeatherEffect returns a valid effect for every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      const effect = getWeatherEffect(w as any);
      expect(effect).toBeDefined();
      expect(typeof effect.staminaMult).toBe('number');
    }
  });

  it('weatherOpeningLine returns string or null for every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      const line = weatherOpeningLine(w as any);
      expect(line === null || typeof line === 'string').toBe(true);
    }
  });

  it('WEATHER_CONFIG has entry for every WEATHER_TYPES member', () => {
    for (const w of WEATHER_TYPES) {
      expect(WEATHER_CONFIG).toHaveProperty(w);
    }
  });

  it('Weather count is 51 (pre-merge baseline)', () => {
    expect(WEATHER_TYPES.length).toBe(51);
  });
});
