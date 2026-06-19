import { describe, it, expect, vi } from 'vitest';
import { getWeatherEffect } from '@/engine/combat/mechanics/weatherEffects';
import { rollWeather } from '@/engine/pipeline/passes/WorldPass';
import { SeededRNGService } from '@/utils/random';

describe('Locust Swarm Feature', () => {
  it('should return a 1.2 multiplier for Locust Swarm stamina drain', () => {
    expect(getWeatherEffect('Locust Swarm').staminaMult).toBe(1.2);
  });

  it('should roll Locust Swarm weather when rng yields high enough value in Summer', () => {
    const rng = new SeededRNGService(123);
    const mock = vi.spyOn(rng, 'next').mockReturnValue(0.77);
    const weather = rollWeather(rng, 'Summer');
    expect(weather).toBe('Locust Swarm');
    mock.mockRestore();
  });
});
