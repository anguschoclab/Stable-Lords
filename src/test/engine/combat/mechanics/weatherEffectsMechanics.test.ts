import { describe, it, expect } from 'vitest';
import { resolveEffectiveWeather, getWeatherEffect } from '@/engine/combat/mechanics/weatherEffects';
import type { WeatherType } from '@/types/state.types';

describe('weatherEffects', () => {
  describe('resolveEffectiveWeather', () => {
    it('returns Clear if arena is indoor', () => {
      expect(resolveEffectiveWeather('Blizzard', ['indoor', 'fancy'])).toBe('Clear');
    });

    it('returns the same weather if arena is not indoor', () => {
      expect(resolveEffectiveWeather('Blizzard', ['outdoor', 'muddy'])).toBe('Blizzard');
    });
  });

  describe('getWeatherEffect', () => {
    it('returns the correct effect for a known weather type', () => {
      const effect = getWeatherEffect('Clear');
      expect(effect.staminaMult).toBe(1.0);
      expect(effect.initiativeMod).toBe(0);
      expect(effect.riposteMod).toBe(0);
      expect(effect.damageMult).toBe(1.0);
    });

    it('falls back to Clear for an unknown weather type', () => {
      const effect = getWeatherEffect('UnknownWeatherType' as WeatherType);
      expect(effect.staminaMult).toBe(1.0);
      expect(effect.initiativeMod).toBe(0);
      expect(effect.riposteMod).toBe(0);
      expect(effect.damageMult).toBe(1.0);
    });
  });
});
