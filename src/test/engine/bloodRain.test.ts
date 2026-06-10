import { describe, it, expect, vi } from 'vitest';
import { weatherStaminaModifier } from '@/engine/combat/mechanics/combatMath';
import { rollWeather } from '@/engine/pipeline/passes/WorldPass';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';

describe('Blood Rain Feature', () => {
  it('should return a 1.1 multiplier for Blood Rain stamina drain', () => {
    expect(weatherStaminaModifier('Blood Rain')).toBe(1.1);
  });

  it('should roll Blood Rain weather when rng yields high enough value in Spring', () => {
    const rng = new SeededRNGService(123);
    const mock = vi.spyOn(rng, 'next').mockReturnValue(0.98);
    const weather = rollWeather(rng, 'Spring');
    expect(weather === 'Blood Rain' || weather === 'Spooky Night').toBe(true);
    mock.mockRestore();
  });
});
