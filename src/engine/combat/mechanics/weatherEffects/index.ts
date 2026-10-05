import type { ArenaConfig, WeatherType } from '@/types/shared.types';
import { WEATHER_EFFECTS } from './table';

export type { WeatherEffect } from './table';
import type { WeatherEffect } from './table';

/**
 * Resolves the final mechanical weather condition based on arena type.
 * Indoor arenas negate all weather effects (return 'Clear').
 */
export function resolveEffectiveWeather(weather: WeatherType, arenaTags: string[]): WeatherType {
  const isIndoor = arenaTags.includes('indoor');
  return isIndoor ? 'Clear' : weather;
}

/**
 * Returns the mechanical weather effect modifiers for a given weather type.
 * Falls back to Clear (neutral) for unknown weather.
 */
export function getWeatherEffect(weather: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS['Clear'];
}

/**
 * Merge an arena's weather-matched `weatherMods` overrides over its base
 * spatial config. Listed keys replace base values; unlisted keys are kept.
 * Returns the arena unchanged when no entry matches the effective weather.
 */
export function applyArenaWeatherMods(arena: ArenaConfig, weather: WeatherType): ArenaConfig {
  const mod = arena.weatherMods?.find((m) => m.weatherType === weather);
  if (!mod) return arena;
  return {
    ...arena,
    zoneDef: mod.zoneDef ? { ...arena.zoneDef, ...mod.zoneDef } : arena.zoneDef,
    surfaceMod: mod.surfaceMod ? { ...arena.surfaceMod, ...mod.surfaceMod } : arena.surfaceMod,
  };
}

// Re-export opening lines for backward compatibility
export { weatherOpeningLine } from '../weatherOpeningLines';
