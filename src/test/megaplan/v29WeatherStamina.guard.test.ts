import { describe, it, expect } from 'vitest';
import { WEATHER_STATS } from '@/constants/arena/weatherStats';
import { WEATHER_EFFECTS } from '@/engine/combat/mechanics/weatherEffects/table';
import type { WeatherType } from '@/types/shared.types';

/**
 * V29-B3 — WEATHER_STATS ↔ WEATHER_EFFECTS.staminaMult coherence.
 *
 * Every weather's display token "STAMINA DRAIN N%" must correspond to
 * `staminaMult === N / 100`, and "STAMINA CONSERVATION N%" to
 * `staminaMult === 1 - N / 100` (the convention every other weather entry
 * already follows). 'Chaos Storm' is the current sole violator: it
 * displays DRAIN 125% while the effect table sets staminaMult 0.8.
 */
describe('V29-B3: weather stamina display/effect coherence (live guard)', () => {
  const weathers = Object.keys(WEATHER_STATS) as WeatherType[];

  for (const w of weathers) {
    it(`${w}: display stamina token matches staminaMult`, () => {
      const stats = WEATHER_STATS[w];
      const effect = WEATHER_EFFECTS[w];
      expect(effect, `${w} missing from WEATHER_EFFECTS`).toBeDefined();
      if (effect.staminaMult === undefined) return;

      const drain = stats.match(/STAMINA DRAIN (\d+)%/);
      const conserve = stats.match(/STAMINA CONSERVATION (\d+)%/);
      if (drain) {
        expect(effect.staminaMult).toBeCloseTo(Number(drain[1]) / 100, 5);
      } else if (conserve) {
        expect(effect.staminaMult).toBeCloseTo(1 - Number(conserve[1]) / 100, 5);
      }
    });
  }
});
