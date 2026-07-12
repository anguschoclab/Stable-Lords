import { describe, it, expect } from 'vitest';
import { WEATHER_TYPES } from '@/types/enumSources';
import { WeatherTypeSchema } from '@/schemas/gameStateSchema';
import type { WeatherType } from '@/types/shared.types';

describe('enumSources sync with WeatherType', () => {
  const schemaOptions = WeatherTypeSchema.options;
  const weatherTypeSet = new Set<WeatherType>([
    'Clear',
    'Rainy',
    'Sweltering',
    'Breezy',
    'Overcast',
    'Blazing Sun',
    'Gale',
    'Blood Moon',
    'Eclipse',
    'Sandstorm',
    'Zephyr',
    'Tornado',
    'Blizzard',
    'Dense Fog',
    'Mist',
    'Thunderstorm',
    'Gravity Anomaly',
    'Ashfall',
    'Eldritch Eclipse',
    'Acid Rain',
    'Mana Surge',
    'Rainbow',
    'Scorching Wind',
    'Wild Magic',
    'Spooky Night',
    'Meteor Shower',
    'Solar Flare',
    'Abyssal Gloom',
    'Cursed Miasma',
    'Hailstorm',
    'Arcane Storm',
    'Blood Rain',
    'Locust Swarm',
    'Aurora Borealis',
    'Chaotic Winds',
    'Aether Storm',
    'Mirage',
    'Ember Rain',
    'Wildfire Smoke',
    'Blood Fog',
    'Shimmering Heat',
    'Crystal Rain',
    'Rain of Frogs',
    'Chaos Storm',
    'Chaos Squall',
    'Astral Dust',
    'Crimson Snow',
    'Whispering Winds',
    'Glittering Frost',
    'Eldritch Eclipse',
    'Moonlight Duel',
  ]);

  it('WeatherTypeSchema has no duplicate entries', () => {
    expect(schemaOptions.length, 'WeatherTypeSchema has duplicate entries').toBe(
      new Set(schemaOptions).size
    );
  });

  it('WEATHER_TYPES count is 50 (48 original + 2 new)', () => {
    expect(WEATHER_TYPES.length).toBe(50);
  });

  it('WeatherTypeSchema options count is 50', () => {
    expect(schemaOptions.length).toBe(50);
  });

  it('WEATHER_TYPES contains every WeatherType union member', () => {
    for (const w of weatherTypeSet) {
      expect(
        WEATHER_TYPES.includes(w as (typeof WEATHER_TYPES)[number]),
        `${w} is missing from WEATHER_TYPES`
      ).toBe(true);
    }
  });

  it('WEATHER_TYPES has no entries not in WeatherType', () => {
    for (const entry of WEATHER_TYPES) {
      expect(
        weatherTypeSet.has(entry),
        `${entry} in WEATHER_TYPES is not a valid WeatherType`
      ).toBe(true);
    }
  });

  it('WEATHER_TYPES matches WeatherTypeSchema entries', () => {
    const schemaSet = new Set(schemaOptions);
    const weatherTypesSet = new Set(WEATHER_TYPES);

    expect(weatherTypesSet.size).toBe(schemaSet.size);
    for (const entry of WEATHER_TYPES) {
      expect(schemaSet.has(entry), `${entry} in WEATHER_TYPES but not in WeatherTypeSchema`).toBe(
        true
      );
    }
  });
});
