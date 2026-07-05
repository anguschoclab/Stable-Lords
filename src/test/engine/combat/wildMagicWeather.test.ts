/**
 * Wild Magic weather — verifies mechanics, season exclusivity, opening line,
 * config/schema/enum sync, and rollWeather integration.
 *
 * Pre-merge test: these will FAIL on main (no 'Wild Magic' in WeatherType)
 * and PASS after the wild-magic-weather branch is merged.
 */
import { describe, it, expect } from 'vitest';
import {
  getWeatherEffect,
  weatherOpeningLine,
  resolveEffectiveWeather,
} from '@/engine/combat/mechanics/weatherEffects';
import {
  SEASONAL_WEATHER,
  rollWeather,
  getWeatherSeason,
} from '@/engine/pipeline/passes/WorldPass';
import { WEATHER_CONFIG } from '@/constants/arena/weather';
import { WEATHER_TYPES } from '@/types/enumSources';
import { WeatherTypeSchema } from '@/schemas/gameStateSchema';
import type { WeatherType } from '@/types/shared.types';
import { SeededRNGService } from '@/utils/random';

const WILD_MAGIC = 'Wild Magic' as WeatherType;

describe('Wild Magic weather', () => {
  describe('getWeatherEffect', () => {
    it('returns damageMult 1.1 for Wild Magic', () => {
      expect(getWeatherEffect(WILD_MAGIC).damageMult).toBe(1.1);
    });

    it('returns staminaMult 1.0 for Wild Magic', () => {
      expect(getWeatherEffect(WILD_MAGIC).staminaMult).toBe(1.0);
    });

    it('returns initiativeMod 0 for Wild Magic', () => {
      expect(getWeatherEffect(WILD_MAGIC).initiativeMod).toBe(0);
    });

    it('returns riposteMod 0 for Wild Magic', () => {
      expect(getWeatherEffect(WILD_MAGIC).riposteMod).toBe(0);
    });

    it('returns non-empty description for Wild Magic', () => {
      const desc = getWeatherEffect(WILD_MAGIC).description;
      expect(desc).toBeDefined();
      expect(desc.length).toBeGreaterThan(5);
    });
  });

  describe('weatherOpeningLine', () => {
    it('returns non-null string for Wild Magic', () => {
      const line = weatherOpeningLine(WILD_MAGIC);
      expect(line).not.toBeNull();
      expect(typeof line).toBe('string');
      expect(line!.length).toBeGreaterThan(5);
    });

    it('string contains "Magic" or "energy"', () => {
      const line = weatherOpeningLine(WILD_MAGIC)!;
      expect(line.toLowerCase()).toMatch(/magic|energy/);
    });
  });

  describe('resolveEffectiveWeather', () => {
    it('returns Clear for Wild Magic in indoor arena', () => {
      expect(resolveEffectiveWeather(WILD_MAGIC, ['indoor'])).toBe('Clear');
    });

    it('returns Wild Magic for outdoor arena', () => {
      expect(resolveEffectiveWeather(WILD_MAGIC, [])).toBe(WILD_MAGIC);
    });
  });

  describe('season exclusivity', () => {
    it('getWeatherSeason returns Spring for Wild Magic', () => {
      expect(getWeatherSeason(WILD_MAGIC)).toBe('Spring');
    });

    it('Wild Magic is in SEASONAL_WEATHER.Spring', () => {
      expect(SEASONAL_WEATHER.Spring).toContain(WILD_MAGIC);
    });

    it('Wild Magic is NOT in SEASONAL_WEATHER.Summer', () => {
      expect(SEASONAL_WEATHER.Summer).not.toContain(WILD_MAGIC);
    });

    it('Wild Magic is NOT in SEASONAL_WEATHER.Fall', () => {
      expect(SEASONAL_WEATHER.Fall).not.toContain(WILD_MAGIC);
    });

    it('Wild Magic is NOT in SEASONAL_WEATHER.Winter', () => {
      expect(SEASONAL_WEATHER.Winter).not.toContain(WILD_MAGIC);
    });
  });

  describe('rollWeather', () => {
    it('can produce Wild Magic in Spring with enough rolls', () => {
      const found = new Set<WeatherType>();
      for (let seed = 0; seed < 5000; seed++) {
        const rng = new SeededRNGService(seed);
        found.add(rollWeather(rng, 'Spring'));
      }
      expect(found.has(WILD_MAGIC)).toBe(true);
    });

    it('never produces Wild Magic in Summer', () => {
      for (let seed = 0; seed < 1000; seed++) {
        const rng = new SeededRNGService(seed);
        expect(rollWeather(rng, 'Summer')).not.toBe(WILD_MAGIC);
      }
    });

    it('never produces Wild Magic in Fall', () => {
      for (let seed = 0; seed < 1000; seed++) {
        const rng = new SeededRNGService(seed);
        expect(rollWeather(rng, 'Fall')).not.toBe(WILD_MAGIC);
      }
    });

    it('never produces Wild Magic in Winter', () => {
      for (let seed = 0; seed < 1000; seed++) {
        const rng = new SeededRNGService(seed);
        expect(rollWeather(rng, 'Winter')).not.toBe(WILD_MAGIC);
      }
    });
  });

  describe('config / schema / enum sync', () => {
    it('WEATHER_CONFIG has Wild Magic entry with icon and description', () => {
      const cfg = WEATHER_CONFIG[WILD_MAGIC];
      expect(cfg).toBeDefined();
      expect(cfg.icon).toBeDefined();
      expect(cfg.description.length).toBeGreaterThan(5);
    });

    it('WEATHER_TYPES in enumSources includes Wild Magic', () => {
      expect(WEATHER_TYPES.includes(WILD_MAGIC as (typeof WEATHER_TYPES)[number])).toBe(true);
    });

    it('WeatherTypeSchema includes Wild Magic', () => {
      expect(WeatherTypeSchema.options.includes(WILD_MAGIC)).toBe(true);
    });
  });
});
