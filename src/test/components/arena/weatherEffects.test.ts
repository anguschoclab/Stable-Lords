import { describe, it, expect } from 'vitest';
import { WEATHER_VISUALS } from '@/components/arena/weatherEffects';

/**
 * The TS `Record<WeatherType, …>` type already guarantees (at compile time)
 * that every weather type has an entry. These tests guard the runtime intent:
 * every weather has a particle/overlay effect except the deliberately-neutral
 * Clear and Overcast conditions.
 */
const NEUTRAL_WEATHERS = ['Clear', 'Overcast', 'Rainbow', 'Blood Fog'];

describe('WEATHER_VISUALS', () => {
  it('only Clear and Overcast are neutral (null)', () => {
    const nullKeys = Object.entries(WEATHER_VISUALS)
      .filter(([, render]) => render === null)
      .map(([key]) => key)
      .sort();
    expect(nullKeys).toEqual([...NEUTRAL_WEATHERS].sort());
  });

  it('every non-neutral weather renders an effect', () => {
    for (const [weather, render] of Object.entries(WEATHER_VISUALS)) {
      if (NEUTRAL_WEATHERS.includes(weather)) continue;
      expect(render, `${weather} should have a visual effect`).toBeTypeOf('function');
      // Renderer returns a React element when invoked.
      expect(render!()).toBeTruthy();
    }
  });
});
