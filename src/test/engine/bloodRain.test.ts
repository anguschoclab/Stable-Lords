import { describe, it, expect, vi } from 'vitest';
import { getWeatherEffect } from '@/engine/combat/mechanics/weatherEffects';
import { rollWeather } from '@/engine/pipeline/passes/WorldPass';
import { SeededRNGService } from '@/utils/random';

describe('Blood Rain Feature', () => {
  it('should return a 1.1 multiplier for Blood Rain stamina drain', () => {
    expect(getWeatherEffect('Blood Rain').staminaMult).toBe(1.1);
  });

  it('should roll Blood Rain weather when rng yields high enough value in Spring', () => {
    const rng = new SeededRNGService(123);
    const mock = vi.spyOn(rng, 'next').mockReturnValue(0.99); // bumped past Spooky Night (0.985)
    const weather = rollWeather(rng, 'Spring');
    expect(weather).toBe('Blood Rain');
    mock.mockRestore();
  });
});
