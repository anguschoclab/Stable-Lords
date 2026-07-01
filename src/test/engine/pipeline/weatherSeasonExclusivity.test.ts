/**
 * Weather season exclusivity — verifies no weather type appears in multiple
 * SEASON_EXCLUSIVE_WEATHER buckets, and that Rain of Frogs is Fall-only.
 */
import { describe, it, expect } from 'vitest';
import {
  SEASONAL_WEATHER,
  rollWeather,
  getWeatherSeason,
} from '@/engine/pipeline/passes/WorldPass';
import { SeededRNGService } from '@/utils/random';
import type { WeatherType, Season } from '@/types/shared.types';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

const ALL_WEATHER_TYPES: WeatherType[] = [
  'Clear', 'Rainy', 'Sweltering', 'Breezy', 'Overcast', 'Blazing Sun',
  'Gale', 'Blood Moon', 'Eclipse', 'Sandstorm', 'Zephyr', 'Tornado',
  'Blizzard', 'Dense Fog', 'Mist', 'Thunderstorm', 'Gravity Anomaly',
  'Ashfall', 'Acid Rain', 'Mana Surge', 'Rainbow', 'Scorching Wind',
  'Spooky Night', 'Meteor Shower', 'Solar Flare', 'Abyssal Gloom',
  'Cursed Miasma', 'Hailstorm', 'Arcane Storm', 'Blood Rain',
  'Locust Swarm', 'Aurora Borealis', 'Chaotic Winds', 'Aether Storm',
  'Mirage', 'Ember Rain', 'Wildfire Smoke', 'Blood Fog',
  'Shimmering Heat', 'Rain of Frogs',
  'Crystal Rain',
];

describe('Weather season exclusivity', () => {
  it('Rain of Frogs is in Fall, NOT in Spring', () => {
    expect(SEASONAL_WEATHER.Fall).toContain('Rain of Frogs');
    expect(SEASONAL_WEATHER.Spring).not.toContain('Rain of Frogs');
  });

  it('getWeatherSeason returns Fall for Rain of Frogs', () => {
    expect(getWeatherSeason('Rain of Frogs')).toBe('Fall');
  });

  it('no weather type appears in more than one SEASON_EXCLUSIVE_WEATHER bucket', () => {
    const SHARED: WeatherType[] = ['Clear', 'Overcast', 'Blood Moon', 'Eclipse', 'Mana Surge'];
    for (const w of ALL_WEATHER_TYPES) {
      if (SHARED.includes(w)) continue;
      const seasonsContaining = SEASONS.filter((s) => SEASONAL_WEATHER[s].includes(w));
      expect(seasonsContaining.length, `${w} appears in ${seasonsContaining.length} seasons`).toBe(1);
    }
  });

  it('all 40 WeatherType values are covered across seasonal buckets', () => {
    const allListed = new Set<WeatherType>();
    for (const s of SEASONS) {
      for (const w of SEASONAL_WEATHER[s]) {
        allListed.add(w);
      }
    }
    expect(allListed.size).toBe(ALL_WEATHER_TYPES.length);
    for (const w of ALL_WEATHER_TYPES) {
      expect(allListed.has(w), `${w} not in any seasonal bucket`).toBe(true);
    }
  });

  it('rollWeather can produce Rain of Frogs in Fall', () => {
    let found = false;
    for (let seed = 0; seed < 10000 && !found; seed++) {
      const w = rollWeather(new SeededRNGService(seed * 7 + 1), 'Fall');
      if (w === 'Rain of Frogs') found = true;
    }
    expect(found).toBe(true);
  });

  it('Crystal Rain is in Winter, NOT in Spring', () => {
    expect(SEASONAL_WEATHER.Winter).toContain('Crystal Rain');
    expect(SEASONAL_WEATHER.Spring).not.toContain('Crystal Rain');
  });

  it('getWeatherSeason returns Winter for Crystal Rain', () => {
    expect(getWeatherSeason('Crystal Rain')).toBe('Winter');
  });

  it('rollWeather does NOT produce Rain of Frogs in Spring', () => {
    for (let seed = 0; seed < 10000; seed++) {
      const w = rollWeather(new SeededRNGService(seed * 7 + 1), 'Spring');
      expect(w).not.toBe('Rain of Frogs');
    }
  });
});
