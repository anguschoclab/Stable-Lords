import { describe, it, expect, vi } from 'vitest';
import { getWeatherEffect } from '@/engine/combat/mechanics/weatherEffects';
import { rollWeather } from '@/engine/pipeline/passes/WorldPass';
import { SeededRNGService } from '@/utils/random';

describe('Blood Moon Feature', () => {
  it('should return a 0.9 multiplier for Blood Moon stamina drain', () => {
    expect(getWeatherEffect('Blood Moon').staminaMult).toBe(0.9);
  });

  it('should roll Blood Moon weather when rng yields high enough value', () => {
    const rng = new SeededRNGService(123);
    const mock = vi.spyOn(rng, 'next').mockReturnValue(0.41);
    const weather = rollWeather(rng, 'Summer');
    expect(weather).toBe('Blood Moon');
    mock.mockRestore();
  });
});
