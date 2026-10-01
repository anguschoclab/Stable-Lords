import { describe, it, expect, vi } from 'vitest';
import { getWeatherSeason, rollWeather, SEASONAL_WEATHER } from '@/engine/weather/seasonalWeather';
import type { WeatherType } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

describe('seasonalWeather', () => {
  describe('getWeatherSeason', () => {
    it('returns "All" for shared weather', () => {
      expect(getWeatherSeason('Clear')).toBe('All');
      expect(getWeatherSeason('Chaos Storm')).toBe('All');
    });

    it('returns specific season for season exclusive weather', () => {
      expect(getWeatherSeason('Rainy')).toBe('Spring');
      expect(getWeatherSeason('Sweltering')).toBe('Summer');
      expect(getWeatherSeason('Gale')).toBe('Fall');
      expect(getWeatherSeason('Blizzard')).toBe('Winter');
    });

    it('returns "All" for unknown weather that is not in any list', () => {
      // Cast to bypass type check for test
      expect(getWeatherSeason('UnknownWeather' as WeatherType)).toBe('All');
    });
  });

  describe('rollWeather', () => {
    const mockRng = (value: number): IRNGService => ({
      next: vi.fn().mockReturnValue(value),
      chance: vi.fn(),
      pick: vi.fn(),
      uuid: vi.fn(),
      roll: vi.fn(),
      shuffle: <T>(a: T[]) => a,
      rollWeighted: vi.fn(),
    });

    it('rolls weather for Spring based on weights', () => {
      // Very low roll -> Clear (25 weight, first in shared pool)
      expect(rollWeather(mockRng(0.01), 'Spring')).toBe('Clear');

      // High roll -> Spring exclusive weather (end of pool)
      // We know there's a lot of weight in the pool, a roll near 0.99
      // should pick from the end of the Spring pool.
      expect(rollWeather(mockRng(0.9999), 'Spring')).toBe(
        SEASONAL_WEATHER.Spring[SEASONAL_WEATHER.Spring.length - 1]
      );
    });

    it('returns fallback if roll somehow escapes loop (float precision)', () => {
      // Providing 1.0 might cause cumulative to exactly equal total
      // which normally can't happen with a unit-interval rng but we can force it.
      // Or 1.1 to exceed the total weight.
      const rng = mockRng(1.1);
      const result = rollWeather(rng, 'Spring');
      expect(result).toBe(SEASONAL_WEATHER.Spring[SEASONAL_WEATHER.Spring.length - 1]);
    });

    it('throws error if the pool is somehow empty', () => {
      const emptyPoolRng = mockRng(0.5);
      // We'll mock SEASONAL_WEATHER for one test
      const originalPool = [...SEASONAL_WEATHER.Summer];
      SEASONAL_WEATHER.Summer.length = 0; // Empty it

      expect(() => rollWeather(emptyPoolRng, 'Summer')).toThrow('Weighted pick pool is empty');

      // Restore
      SEASONAL_WEATHER.Summer.push(...originalPool);
    });
  });
});
