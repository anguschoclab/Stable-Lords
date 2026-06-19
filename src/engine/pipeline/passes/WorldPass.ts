import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import type { GameState, WeatherType, Season } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';

/**
 * Stable Lords — World Pipeline Pass
 * Handles seasonal transitions and weather changes.
 */
const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];

/**
 * Compute next season.
 */
export function computeNextSeason(newWeek: number): Season {
  return SEASONS[Math.floor((newWeek - 1) / 13) % 4]!;
}

// ─── Seasonal Weather Buckets ──────────────────────────────────────────────

/**
 * Weathers available in every season.
 */
const SHARED_WEATHER: WeatherType[] = ['Clear', 'Overcast', 'Blood Moon', 'Eclipse', 'Mana Surge'];

/**
 * Season-exclusive weather pools.  Every WeatherType must appear in exactly one
 * seasonal bucket or in {@link SHARED_WEATHER}.  Adding a new weather is as
 * simple as appending it to the appropriate array — `rollWeather` picks up the
 * change automatically.
 */
const SEASON_EXCLUSIVE_WEATHER: Record<Season, WeatherType[]> = {
  Spring: ['Rainy', 'Breezy', 'Zephyr', 'Rainbow', 'Mist', 'Arcane Storm', 'Blood Rain', 'Aether Storm'],
  Summer: [
    'Sweltering',
    'Blazing Sun',
    'Sandstorm',
    'Tornado',
    'Ashfall',
    'Scorching Wind',
    'Solar Flare',
    'Locust Swarm',
    'Mirage',
    'Ember Rain',
    'Wildfire Smoke',
    'Shimmering Heat',
    'Thunderstorm',
  ],
  Fall: ['Gale', 'Dense Fog', 'Chaotic Winds', 'Cursed Miasma', 'Acid Rain', 'Spooky Night', 'Blood Fog'],
  Winter: ['Blizzard', 'Hailstorm', 'Abyssal Gloom', 'Meteor Shower', 'Aurora Borealis', 'Gravity Anomaly'],
};

/**
 * Full weather pool per season (shared + exclusive).  Computed once at module
 * load and exported for use by UI components and tests.
 */
export const SEASONAL_WEATHER: Record<Season, WeatherType[]> = {
  Spring: [...SHARED_WEATHER, ...SEASON_EXCLUSIVE_WEATHER.Spring],
  Summer: [...SHARED_WEATHER, ...SEASON_EXCLUSIVE_WEATHER.Summer],
  Fall: [...SHARED_WEATHER, ...SEASON_EXCLUSIVE_WEATHER.Fall],
  Winter: [...SHARED_WEATHER, ...SEASON_EXCLUSIVE_WEATHER.Winter],
};

/**
 * Relative weights for each weather tier.  The actual probability of a weather
 * is its weight divided by the total weight of all weathers in the season's
 * bucket.  Shared weathers use the same weight in every season.
 */
const WEATHER_WEIGHTS: Partial<Record<WeatherType, number>> = {
  // Common (shared)
  Clear: 25,
  Overcast: 15,
  // Rare (shared)
  'Blood Moon': 1.5,
  Eclipse: 0.5,
  'Mana Surge': 0.5,

  // Spring-exclusive
  Rainy: 10,
  Breezy: 8,
  Zephyr: 3,
  Rainbow: 3,
  Mist: 5,
  'Arcane Storm': 2,
  'Blood Rain': 1,
  'Aether Storm': 1,

  // Summer-exclusive
  Sweltering: 10,
  'Blazing Sun': 4,
  Sandstorm: 6,
  Tornado: 3,
  Ashfall: 3,
  'Scorching Wind': 5,
  'Solar Flare': 2,
  'Locust Swarm': 3,
  Mirage: 5,
  'Ember Rain': 1,
  'Wildfire Smoke': 1,
  'Shimmering Heat': 4,
  Thunderstorm: 10,

  // Fall-exclusive
  Gale: 5,
  'Dense Fog': 4,
  'Chaotic Winds': 3,
  'Cursed Miasma': 3,
  'Acid Rain': 5,
  'Spooky Night': 1.5,
  'Blood Fog': 1,

  // Winter-exclusive
  Blizzard: 15,
  Hailstorm: 5,
  'Abyssal Gloom': 2,
  'Meteor Shower': 1,
  'Aurora Borealis': 0.5,
  'Gravity Anomaly': 0.5,
};

const DEFAULT_WEIGHT = 1;

/**
 * Roll weather using the seasonal bucket system.
 *
 * Builds a cumulative-weight table from {@link SEASONAL_WEATHER} for the given
 * season, rolls once, and returns the selected weather.  Every weather in the
 * bucket has a non-zero chance.
 */
export function rollWeather(rng: IRNGService, season: Season): WeatherType {
  const pool = SEASONAL_WEATHER[season];
  const weights = pool.map((w) => WEATHER_WEIGHTS[w] ?? DEFAULT_WEIGHT);
  const total = weights.reduce((sum, w) => sum + w, 0);

  const roll = rng.next() * total;
  let cumulative = 0;
  for (let i = 0; i < pool.length; i++) {
    cumulative += weights[i]!;
    if (roll < cumulative) return pool[i]!;
  }
  // Fallback (should never reach here due to float precision)
  return pool[pool.length - 1]!;
}

/**
 * Returns the season a weather type belongs to, or `'All'` for shared weathers.
 */
export function getWeatherSeason(weather: WeatherType): Season | 'All' {
  if (SHARED_WEATHER.includes(weather)) return 'All';
  for (const season of SEASONS) {
    if (SEASON_EXCLUSIVE_WEATHER[season].includes(weather)) return season;
  }
  return 'All';
}

/**
 * Run world pass.
 * @param rng - Rng. (optional)
 */
export function runWorldPass(_state: GameState, nextWeek: number, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(nextWeek * 13);
  const nextSeason = computeNextSeason(nextWeek);
  const nextWeather = rollWeather(rngService, nextSeason);

  return {
    week: nextWeek,
    season: nextSeason,
    weather: nextWeather,
  };
}
