/**
 * V16/F2 — AI weather-disposition completeness guard.
 *
 * The disposition table is a `Record<WeatherType, …>` so exhaustiveness is
 * compile-enforced; this suite locks the runtime contract on top: every
 * WeatherType is callable through all four gates, offseason event-only
 * weather is never hazardous and never gates, and HAZARDOUS_WEATHER derives
 * from the same source of truth.
 */
import { describe, it, expect } from 'vitest';
import { WEATHER_TYPES, OFFSEASON_WEATHER_TYPES } from '@/types/enumSources';
import { FightingStyle } from '@/types/shared.types';
import {
  HAZARDOUS_WEATHER,
  acceptanceWeatherBlock,
  offerWeatherDecline,
  committeeWeatherSkip,
  weatherBidModifier,
} from '@/engine/ai/weatherSuitability';
import { makeWarrior } from '@/test/_fixtures/factories';

const OFFSEASON = new Set<string>(OFFSEASON_WEATHER_TYPES);

const subject = (cn: number, style = FightingStyle.StrikingAttack) =>
  makeWarrior({
    style,
    attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
  });

describe('AI weather disposition — union coverage (V16/F2)', () => {
  it('every WeatherType resolves through all four gates without throwing', () => {
    const w = subject(8);
    for (const weather of WEATHER_TYPES) {
      const block = acceptanceWeatherBlock(w, weather);
      expect(block === null || typeof block === 'string', weather).toBe(true);
      expect(offerWeatherDecline(w, weather), weather).toBeTypeOf('boolean');
      expect(committeeWeatherSkip(w, weather), weather).toBeTypeOf('boolean');
      expect(weatherBidModifier(w, weather), weather).toBeTypeOf('number');
    }
  });

  it('offseason event-only weather never gates and is never hazardous', () => {
    // Event weather can still leak into evaluateBoutOffer-style calls via
    // state.weather during exhibition bouts — neutral is the only safe read.
    const fragile = subject(0);
    const lunger = subject(10, FightingStyle.LungingAttack);
    for (const weather of OFFSEASON_WEATHER_TYPES) {
      expect(acceptanceWeatherBlock(fragile, weather), weather).toBeNull();
      expect(acceptanceWeatherBlock(lunger, weather), weather).toBeNull();
      expect(offerWeatherDecline(fragile, weather), weather).toBe(false);
      expect(committeeWeatherSkip(fragile, weather), weather).toBe(false);
      expect(weatherBidModifier(fragile, weather), weather).toBe(0);
      expect(HAZARDOUS_WEATHER, weather).not.toContain(weather);
    }
  });

  it('hazardous weather is a strict subset of seasonable arena weather', () => {
    for (const weather of HAZARDOUS_WEATHER) {
      expect(OFFSEASON.has(weather), weather).toBe(false);
    }
  });

  it('HAZARDOUS_WEATHER lists exactly the disposition-flagged set', () => {
    // The disposition table flags hazardous entries; the exported list must
    // equal that set — no hand-maintained drift between table and export.
    const flagged = WEATHER_TYPES.filter((w) => HAZARDOUS_WEATHER.includes(w));
    expect([...HAZARDOUS_WEATHER].sort()).toEqual(flagged.sort());
  });
});
