import { describe, it, expect, vi } from 'vitest';
import { weatherStaminaModifier } from '@/engine/combat/mechanics/combatMath';
import { rollWeather } from '@/engine/pipeline/passes/WorldPass';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

describe('Blood Moon Feature', () => {
  it('should return a 1.1 multiplier for Blood Moon stamina drain', () => {
    expect(weatherStaminaModifier('Blood Moon')).toBe(1.1);
  });

  it('should roll Blood Moon weather when rng yields high enough value', () => {
    const rng = new SeededRNGService(123);
    const mock = vi.spyOn(rng, 'next').mockReturnValue(0.99);
    const weather = rollWeather(rng, 'Summer');
    expect(weather).toBe('Blood Moon');
    mock.mockRestore();
  });
});
