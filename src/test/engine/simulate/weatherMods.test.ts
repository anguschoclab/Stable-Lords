// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import * as arenasModule from '@/data/arenas';
import { initializeResolutionContext } from '@/engine/simulate/initialization';
import { getZonePenalty } from '@/engine/combat/mechanics/distanceResolution';
import { makeArena, makePlan, makeWarrior } from '@/test/_fixtures/factories';

/**
 * V2-04 — `ArenaConfig.weatherMods` per-weather spatial overrides.
 *
 * The field is declared (`types/shared/spatial.ts`), schema-validated, and
 * spec'd by the spatial-system doc, but no reader exists: the resolution
 * context always uses the base `zoneDef`/`surfaceMod`. These tests pin the
 * merge contract — matching weather applies the overrides, any other weather
 * leaves the base config untouched.
 */
describe('arena weatherMods — weather-conditional spatial overrides (V2-04)', () => {
  beforeAll(() => {
    arenasModule.registerArena(
      makeArena({
        id: 'test_weather_mods',
        zoneDef: { Edge: -2, Corner: -4 },
        surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
        weatherMods: [
          {
            weatherType: 'Rainy',
            zoneDef: { Edge: -6 },
            surfaceMod: { initiativeMod: -4 },
          },
        ],
      })
    );
  });

  const buildCtx = (weather: 'Rainy' | 'Clear') =>
    initializeResolutionContext({
      planA: makePlan(),
      planD: makePlan(),
      effectiveWeather: weather,
      warriorA: makeWarrior(),
      warriorD: makeWarrior(),
      arenaId: 'test_weather_mods',
    });

  it('applies weather-matched surfaceMod overrides', () => {
    const ctx = buildCtx('Rainy');
    expect(ctx.surfaceMod.initiativeMod).toBe(-4);
  });

  it('keeps unlisted surfaceMod keys at base values under a partial override', () => {
    const ctx = buildCtx('Rainy');
    expect(ctx.surfaceMod.enduranceMult).toBe(1.0);
    expect(ctx.surfaceMod.riposteMod).toBe(0);
  });

  it('applies weather-matched zoneDef overrides to zone penalties', () => {
    const ctx = buildCtx('Rainy');
    expect(getZonePenalty('Edge', ctx.arenaConfig)).toBe(-6);
    // Zones not overridden keep the base penalty.
    expect(getZonePenalty('Corner', ctx.arenaConfig)).toBe(-4);
  });

  it('ignores weatherMods when the weather does not match', () => {
    const ctx = buildCtx('Clear');
    expect(ctx.surfaceMod.initiativeMod).toBe(0);
    expect(getZonePenalty('Edge', ctx.arenaConfig)).toBe(-2);
  });

  it('does not mutate the registered arena config', () => {
    buildCtx('Rainy');
    const registered = arenasModule.getArenaById('test_weather_mods');
    expect(registered.zoneDef.Edge).toBe(-2);
    expect(registered.surfaceMod.initiativeMod).toBe(0);
  });
});
