/**
 * Rain of Frogs weather type — verifies the weather was added across all registries.
 */
import { describe, it, expect } from 'vitest';
import { getWeatherEffect, weatherOpeningLine } from '@/engine/combat/mechanics/weatherEffects';
import { WEATHER_CONFIG } from '@/constants/arena/weather';
import { WeatherTypeSchema } from '@/schemas/gameStateSchema';
import { SEASONAL_WEATHER, rollWeather } from '@/engine/pipeline/passes/WorldPass';
import type { WeatherType } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';

describe('Rain of Frogs weather', () => {
  it('is a valid WeatherType', () => {
    const weather: WeatherType = 'Rain of Frogs';
    expect(weather).toBe('Rain of Frogs');
  });

  it('is included in WeatherTypeSchema', () => {
    const result = WeatherTypeSchema.safeParse('Rain of Frogs');
    expect(result.success).toBe(true);
  });

  it('getWeatherEffect returns correct stats', () => {
    const effect = getWeatherEffect('Rain of Frogs');
    expect(effect.staminaMult).toBe(1.1);
    expect(effect.initiativeMod).toBe(-4);
    expect(effect.riposteMod).toBe(-2);
    expect(effect.damageMult).toBe(0.9);
  });

  it('getWeatherEffect description does not use "combatants"', () => {
    const effect = getWeatherEffect('Rain of Frogs');
    expect(effect.description).not.toContain('combatants');
  });

  it('WEATHER_CONFIG has entry with required fields', () => {
    const config = WEATHER_CONFIG['Rain of Frogs'];
    expect(config).toBeDefined();
    expect(config.icon).toBeDefined();
    expect(config.colorClass).toBeDefined();
    expect(config.bgClass).toBeDefined();
    expect(config.borderClass).toBeDefined();
    expect(config.description).toBeDefined();
    expect(typeof config.description).toBe('string');
  });

  it('WEATHER_CONFIG uses arena tokens (not raw Tailwind colors)', () => {
    const config = WEATHER_CONFIG['Rain of Frogs'];
    expect(config.colorClass).not.toContain('green-500');
    expect(config.bgClass).not.toContain('green-500');
    expect(config.borderClass).not.toContain('green-500');
  });

  it('weatherOpeningLine returns non-empty string', () => {
    const line = weatherOpeningLine('Rain of Frogs');
    expect(line).not.toBeNull();
    expect(typeof line).toBe('string');
    expect(line!.length).toBeGreaterThan(0);
  });

  it('is reachable in seasonal weather pool', () => {
    const allSeasons = [
      ...SEASONAL_WEATHER.Spring,
      ...SEASONAL_WEATHER.Summer,
      ...SEASONAL_WEATHER.Fall,
      ...SEASONAL_WEATHER.Winter,
    ];
    expect(allSeasons).toContain('Rain of Frogs');
  });

  it('rollWeather can produce Rain of Frogs', () => {
    let found = false;
    for (let seed = 0; seed < 10000 && !found; seed++) {
      const seasons = ['Spring', 'Fall'] as const;
      for (const season of seasons) {
        const w = rollWeather(new SeededRNGService(seed * 7 + 1), season);
        if (w === 'Rain of Frogs') {
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });
});
