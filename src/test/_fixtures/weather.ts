import { vi } from 'vitest';
import { SeededRNG } from '@/utils/random';
import { rollWeather } from '@/engine/weather/seasonalWeather';
import type { WeatherType, Season } from '@/types/shared.types';

/**
 * The weather types that can occur during regular weeks — i.e. every
 * WeatherType except the offseason-exclusive events (Dreamweavers Mist,
 * Moonlight Duel, Eldritch Eclipse, etc.). Seasonal-weather coverage tests
 * iterate this set against SEASONAL_WEATHER.
 */
export const SEASONABLE_WEATHER_TYPES: WeatherType[] = [
  'Clear',
  'Rainy',
  'Sweltering',
  'Breezy',
  'Overcast',
  'Blazing Sun',
  'Gale',
  'Blood Moon',
  'Eclipse',
  'Sandstorm',
  'Zephyr',
  'Tornado',
  'Blizzard',
  'Dense Fog',
  'Mist',
  'Thunderstorm',
  'Gravity Anomaly',
  'Ashfall',
  'Acid Rain',
  'Mana Surge',
  'Rainbow',
  'Scorching Wind',
  'Wild Magic',
  'Spooky Night',
  'Meteor Shower',
  'Solar Flare',
  'Abyssal Gloom',
  'Cursed Miasma',
  'Hailstorm',
  'Arcane Storm',
  'Blood Rain',
  'Locust Swarm',
  'Aurora Borealis',
  'Chaotic Winds',
  'Aether Storm',
  'Mirage',
  'Ember Rain',
  'Wildfire Smoke',
  'Blood Fog',
  'Shimmering Heat',
  'Crystal Rain',
  'Rain of Frogs',
  'Astral Dust',
  'Chaos Storm',
  'Chaos Squall',
  'Prismatic Gale',
  'Crimson Snow',
  'Whispering Winds',
  'Glittering Frost',
  'Temporal Rift',
  'Stardust Gale',
  'Abyssal Tempest',
  'Cursed Eclipse',
];

/** Stubs rng.next to a fixed value for the duration of fn — spy + restore included. */
export function stubRngNext<T>(rng: SeededRNG, value: number, fn: () => T): T {
  const mock = vi.spyOn(rng, 'next').mockReturnValue(value);
  try {
    return fn();
  } finally {
    mock.mockRestore();
  }
}

/** Rolls seasonal weather with a forced rng.next value — kills the spy+restore boilerplate. */
export function rollStubbedWeather(season: Season, rollValue: number): WeatherType {
  const rng = new SeededRNG(0);
  return stubRngNext(rng, rollValue, () => rollWeather(rng, season));
}
