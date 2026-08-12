/**
 * Weather type completeness — verifies all weather registries are in sync
 * and have no duplicates. Scans WEATHER_TYPES (enumSources), WeatherTypeSchema
 * (schemaEnums), and the WeatherType union (shared.types.ts source) for
 * duplicate members, and confirms every member has effect/config/line entries.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
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
    const weatherSet = new Set(WEATHER_TYPES as readonly string[]);
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

  it('Weather count is 58 (post-merge with chaos weaver branches)', () => {
    expect(WEATHER_TYPES.length).toBe(58);
  });

  it('WeatherType union in shared.types.ts has no duplicate members', () => {
    const source = readFileSync('src/types/shared.types.ts', 'utf-8');
    const match = source.match(/export type WeatherType =\s*([\s\S]*?);/);
    expect(match).not.toBeNull();
    const unionBody = match?.[1] ?? '';
    const members = [...unionBody.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(new Set(members).size).toBe(members.length);
  });
});
