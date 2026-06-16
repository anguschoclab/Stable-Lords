import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import type { GameState, WeatherType, Season } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';

/**
 * Stable Lords — World Pipeline Pass
 * Handles seasonal transitions and weather changes.
 */
const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter']; /**
                                                                   * Compute next season.
                                                                   * @param newWeek - New week.
                                                                   * @returns The result.
                                                                   */

/**
 * Compute next season.
 * @param newWeek - New week.
 * @returns The result.
 */
export function computeNextSeason(newWeek: number): Season {
  return SEASONS[Math.floor((newWeek - 1) / 13) % 4]!;
} /**
   * Roll weather.
   * @param rng - Rng.
   * @param season - Season.
   * @returns The result.
   */

/**
 * Roll weather.
 * @param rng - Rng.
 * @param season - Season.
 * @returns The result.
 */
export function rollWeather(rng: IRNGService, season: Season): WeatherType {
  const roll = rng.next();

  // Summer: Hot, dry, and storm-prone
  if (season === 'Summer') {
    if (roll < 0.25) return 'Clear';
    if (roll < 0.3) return 'Mirage';
    if (roll < 0.34) return 'Shimmering Heat';
    if (roll < 0.38) return 'Blazing Sun';
    if (roll < 0.45) return 'Scorching Wind';
    if (roll < 0.55) return 'Sweltering';
    if (roll < 0.65) return 'Overcast';
    if (roll < 0.75) return 'Thunderstorm';
    if (roll < 0.81) return 'Sandstorm';
    if (roll < 0.84) return 'Tornado';
    if (roll < 0.87) return 'Ashfall';
    if (roll < 0.9) return 'Locust Swarm';
    if (roll < 0.93) return 'Gale';
    if (roll < 0.94) return 'Ember Rain';
    if (roll < 0.95) return 'Wildfire Smoke';
    if (roll < 0.97) return 'Solar Flare';
    if (roll < 0.985) return 'Blood Moon';
    if (roll < 0.995) return 'Eclipse';
    return 'Mana Surge';
  }

  // Winter: Cold, dark, and frozen
  if (season === 'Winter') {
    if (roll < 0.25) return 'Clear';
    if (roll < 0.5) return 'Overcast';
    if (roll < 0.65) return 'Blizzard';
    if (roll < 0.7) return 'Hailstorm';
    if (roll < 0.78) return 'Rainy';
    if (roll < 0.86) return 'Dense Fog';
    if (roll < 0.92) return 'Gale';
    if (roll < 0.96) return 'Breezy';
    if (roll < 0.98) return 'Abyssal Gloom';
    if (roll < 0.985) return 'Blood Moon';
    if (roll < 0.99) return 'Eclipse';
    if (roll < 0.993) return 'Meteor Shower';
    if (roll < 0.996) return 'Aurora Borealis';
    if (roll < 0.998) return 'Gravity Anomaly';
    return 'Mana Surge';
  }

  // Spring/Fall: Wet, windy, and unpredictable
  if (roll < 0.35) return 'Clear';
  if (roll < 0.38) return 'Rainbow';
  if (roll < 0.40) return 'Zephyr';
  if (roll < 0.5) return 'Overcast';
  if (roll < 0.6) return 'Rainy';
  if (roll < 0.65) return 'Mist';
  if (roll < 0.75) return 'Breezy';
  if (roll < 0.78) return 'Chaotic Winds';
  if (roll < 0.8) return 'Dense Fog';
  if (roll < 0.83) return 'Cursed Miasma';
  if (roll < 0.88) return 'Thunderstorm';
  if (roll < 0.93) return 'Acid Rain';
  if (roll < 0.95) return 'Gale';
  if (roll < 0.97) return 'Arcane Storm';
  if (roll < 0.985) return 'Spooky Night';
  if (roll < 0.992) return 'Blood Rain';
  if (roll < 0.993) return 'Aether Storm';
  if (roll < 0.995) return 'Blood Moon';
  if (roll < 0.997) return 'Eclipse';
  if (roll < 0.9985) return 'Blood Fog';
  if (roll < 0.999) return 'Gravity Anomaly';
  return 'Mana Surge';
}

/**
 * Run world pass.
 * @param _state - _state.
 * @param nextWeek - Next week.
 * @param rng - Rng. (optional)
 * @returns The result.
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
