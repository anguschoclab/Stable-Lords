/**
 * Weather Effects — mechanical modifiers for weather conditions.
 * Pure data mapping with no side effects.
 */
import { describe, it, expect } from 'vitest';
import {
  getWeatherEffect,
  resolveEffectiveWeather,
  weatherOpeningLine,
} from '@/engine/combat/mechanics/weatherEffects';
import type { WeatherType } from '@/types/shared.types';

describe('weatherEffects', () => {
  describe('getWeatherEffect', () => {
    it('returns baseline Clear effect for unknown weather', () => {
      const effect = getWeatherEffect('UnknownWeather' as WeatherType);
      expect(effect.staminaMult).toBe(1.0);
      expect(effect.initiativeMod).toBe(0);
      expect(effect.riposteMod).toBe(0);
      expect(effect.damageMult).toBe(1.0);
    });

    it('returns Clear effect with neutral modifiers', () => {
      const effect = getWeatherEffect('Clear');
      expect(effect.staminaMult).toBe(1.0);
      expect(effect.initiativeMod).toBe(0);
      expect(effect.riposteMod).toBe(0);
      expect(effect.damageMult).toBe(1.0);
      expect(effect.description).toBe('Ideal conditions. No advantage given.');
    });

    it('returns Rainy effect with correct modifiers', () => {
      const effect = getWeatherEffect('Rainy');
      expect(effect.staminaMult).toBe(1.1);
      expect(effect.initiativeMod).toBe(-3);
      expect(effect.riposteMod).toBe(5);
      expect(effect.damageMult).toBe(0.9);
    });

    it('returns Sweltering effect with stamina penalty', () => {
      const effect = getWeatherEffect('Sweltering');
      expect(effect.staminaMult).toBe(1.3);
      expect(effect.initiativeMod).toBe(0);
      expect(effect.damageMult).toBe(1.0);
    });

    it('returns Blood Moon with damage and initiative bonuses', () => {
      const effect = getWeatherEffect('Blood Moon');
      expect(effect.staminaMult).toBe(0.9);
      expect(effect.initiativeMod).toBe(3);
      expect(effect.damageMult).toBe(1.2);
    });

    it('returns Eclipse with extreme bonuses', () => {
      const effect = getWeatherEffect('Eclipse');
      expect(effect.staminaMult).toBe(0.8);
      expect(effect.initiativeMod).toBe(5);
      expect(effect.riposteMod).toBe(5);
      expect(effect.damageMult).toBe(1.3);
    });

    it('returns Mana Surge with maximum bonuses', () => {
      const effect = getWeatherEffect('Mana Surge');
      expect(effect.staminaMult).toBe(0.7);
      expect(effect.initiativeMod).toBe(10);
      expect(effect.riposteMod).toBe(10);
      expect(effect.damageMult).toBe(1.5);
    });

    it('all weather types have required effect properties', () => {
      const allWeatherTypes: WeatherType[] = ['Clear', 'Rainy', 'Sweltering', 'Breezy', 'Overcast', 'Blazing Sun', 'Gale', 'Blood Moon', 'Eclipse', 'Sandstorm', 'Tornado', 'Blizzard', 'Dense Fog', 'Mist', 'Thunderstorm', 'Ashfall', 'Acid Rain', 'Mana Surge', 'Scorching Wind', 'Spooky Night', 'Meteor Shower', 'Abyssal Gloom', 'Cursed Miasma', 'Hailstorm', 'Solar Flare', 'Arcane Storm', 'Blood Rain', 'Locust Swarm', 'Aurora Borealis', 'Chaotic Winds', 'Aether Storm'];
      for (const weather of allWeatherTypes) {
        const effect = getWeatherEffect(weather);
        expect(effect).toHaveProperty('staminaMult');
        expect(effect).toHaveProperty('initiativeMod');
        expect(effect).toHaveProperty('riposteMod');
        expect(effect).toHaveProperty('damageMult');
        expect(effect).toHaveProperty('description');
        expect(typeof effect.staminaMult).toBe('number');
        expect(typeof effect.description).toBe('string');
      }
    });
  });

  describe('resolveEffectiveWeather', () => {
    it('returns Clear for indoor arenas regardless of weather', () => {
      expect(resolveEffectiveWeather('Rainy', ['indoor'])).toBe('Clear');
      expect(resolveEffectiveWeather('Blood Moon', ['indoor'])).toBe('Clear');
      expect(resolveEffectiveWeather('Tornado', ['indoor'])).toBe('Clear');
    });

    it('returns original weather for outdoor arenas', () => {
      expect(resolveEffectiveWeather('Rainy', [])).toBe('Rainy');
      expect(resolveEffectiveWeather('Clear', [])).toBe('Clear');
      expect(resolveEffectiveWeather('Blood Moon', [])).toBe('Blood Moon');
    });

    it('returns original weather when arenaTags is empty', () => {
      expect(resolveEffectiveWeather('Sweltering', [])).toBe('Sweltering');
    });

    it('returns Clear only when indoor tag is present', () => {
      expect(resolveEffectiveWeather('Gale', ['outdoor', 'covered'])).toBe('Gale');
      expect(resolveEffectiveWeather('Gale', ['indoor', 'climate-controlled'])).toBe('Clear');
    });
  });

  describe('weatherOpeningLine', () => {
    it('returns null for Clear weather', () => {
      expect(weatherOpeningLine('Clear')).toBeNull();
    });

    it('returns null for Overcast weather', () => {
      expect(weatherOpeningLine('Overcast')).toBeNull();
    });

    it('returns descriptive string for Rainy weather', () => {
      const line = weatherOpeningLine('Rainy');
      expect(line).toContain('Rain');
    });

    it('returns descriptive string for Blood Moon', () => {
      const line = weatherOpeningLine('Blood Moon');
      expect(line).toContain('moon');
    });

    it('returns null for unknown weather', () => {
      expect(weatherOpeningLine('UnknownWeather' as WeatherType)).toBeNull();
    });

    it('all defined weather types return strings or null', () => {
      const allWeatherTypes: WeatherType[] = ['Clear', 'Rainy', 'Sweltering', 'Breezy', 'Overcast', 'Blazing Sun', 'Gale', 'Blood Moon', 'Eclipse', 'Sandstorm', 'Tornado', 'Aurora Borealis'];
      for (const weather of allWeatherTypes) {
        const line = weatherOpeningLine(weather);
        expect(line === null || typeof line === 'string').toBe(true);
      }
    });

    it('atmospheric weather returns non-null lines', () => {
      const atmospheric = ['Rainy', 'Sweltering', 'Breezy', 'Blazing Sun', 'Gale', 'Blood Moon'];
      for (const weather of atmospheric) {
        const line = weatherOpeningLine(weather as WeatherType);
        expect(line).not.toBeNull();
        expect(typeof line).toBe('string');
        expect(line!.length).toBeGreaterThan(0);
      }
    });
  });
});
