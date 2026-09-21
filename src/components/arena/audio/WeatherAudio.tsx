import { useEffect, useRef } from 'react';
import type { WeatherType } from '@/types/shared.types';

import { isIndoorArena } from '@/data/arenas';
import { WEATHER_AMBIENCE } from '@/constants/arena/weatherAmbience';

interface WeatherAudioProps {
  weather: WeatherType;
  volume: number;
  enabled: boolean;
  arenaId?: string;
}

/**
 * Weather audio.
 */
export default function WeatherAudio({ weather, volume, enabled, arenaId }: WeatherAudioProps) {
  const currentWeatherRef = useRef<WeatherType | null>(null);
  const isIndoor = isIndoorArena(arenaId);
  const effectiveWeather = isIndoor ? 'Clear' : weather;

  useEffect(() => {
    if (!enabled) return;

    // Crossfade between weather states
    if (effectiveWeather !== currentWeatherRef.current) {
      const oldAmbience = currentWeatherRef.current
        ? WEATHER_AMBIENCE[currentWeatherRef.current]
        : null;
      const newAmbience = WEATHER_AMBIENCE[effectiveWeather];

      if (oldAmbience !== newAmbience) {
        // Audio crossfade placeholder — implement actual playback here
      }

      currentWeatherRef.current = effectiveWeather;
    }
  }, [effectiveWeather, volume, enabled]);

  // Update volume without changing weather
  useEffect(() => {
    if (!enabled || !currentWeatherRef.current) return;

    const ambience = WEATHER_AMBIENCE[currentWeatherRef.current];
    if (ambience) {
      // Volume update placeholder — implement actual playback here
    }
  }, [volume, enabled]);

  return null;
}
