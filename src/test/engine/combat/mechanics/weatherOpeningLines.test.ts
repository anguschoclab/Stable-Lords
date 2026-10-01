import { describe, it, expect } from 'vitest';
import { weatherOpeningLine } from '@/engine/combat/mechanics/weatherOpeningLines';
import type { WeatherType } from '@/types/shared.types';

describe('weatherOpeningLines', () => {
  it('returns a string for an active weather type', () => {
    expect(typeof weatherOpeningLine('Rainy')).toBe('string');
  });

  it('returns null for Clear or Overcast', () => {
    expect(weatherOpeningLine('Clear')).toBeNull();
    expect(weatherOpeningLine('Overcast')).toBeNull();
  });

  it('returns null for an unknown weather type', () => {
    expect(weatherOpeningLine('UnknownWeather' as WeatherType)).toBeNull();
  });
});
