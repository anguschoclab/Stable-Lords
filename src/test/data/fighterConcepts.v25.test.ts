/**
 * V25 — Assur's tank/riposting-hybrid example builds ported as fighter
 * concepts: canonStats preserve the 84-pt spread, stats scale to 70.
 */
import { describe, it, expect } from 'vitest';
import { FIGHTER_CONCEPTS } from '@/data/fighterConcepts';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_TOTAL,
  ATTRIBUTE_MIN,
  ATTRIBUTE_MAX,
  FightingStyle,
  type Attributes,
} from '@/types/shared.types';

const CANON_SPREADS: { style: FightingStyle; name: RegExp; spread: number[] }[] = [
  // WS low-will tank-riposte line (article order ST-CN-SZ-WT-WL-SP-DF).
  { style: FightingStyle.WallOfSteel, name: /21-15|flagship|perfect/i, spread: [21, 15, 6, 11, 7, 13, 11] },
  { style: FightingStyle.WallOfSteel, name: /./, spread: [17, 16, 5, 11, 8, 16, 11] },
  { style: FightingStyle.WallOfSteel, name: /./, spread: [21, 13, 5, 11, 10, 13, 11] },
  { style: FightingStyle.WallOfSteel, name: /./, spread: [17, 10, 8, 15, 10, 7, 17] },
  { style: FightingStyle.WallOfSteel, name: /./, spread: [17, 14, 4, 17, 9, 8, 15] },
  { style: FightingStyle.WallOfSteel, name: /./, spread: [17, 13, 4, 17, 9, 13, 11] },
  // AB Snotling line (Manager's model).
  { style: FightingStyle.AimedBlow, name: /snotling/i, spread: [17, 15, 6, 17, 8, 4, 17] },
  { style: FightingStyle.AimedBlow, name: /./, spread: [15, 16, 8, 11, 7, 10, 17] },
  { style: FightingStyle.AimedBlow, name: /./, spread: [15, 15, 7, 11, 7, 8, 21] },
  // PR marginal example (notes must say so honestly).
  { style: FightingStyle.ParryRiposte, name: /./, spread: [21, 11, 7, 11, 7, 12, 15] },
];

const sum = (a: Attributes) => ATTRIBUTE_KEYS.reduce((s, k) => s + a[k], 0);

describe('V25 fighter concepts — canon spreads', () => {
  it.each(CANON_SPREADS)('$style concept $spread ported with 84-pt canonStats', ({ style, spread }) => {
    const [ST, CN, SZ, WT, WL, SP, DF] = spread as [
      number, number, number, number, number, number, number,
    ];
    const canon: Attributes = { ST, CN, SZ, WT, WL, SP, DF };
    expect(FIGHTER_CONCEPTS[style].concepts.some((c) => {
      return ATTRIBUTE_KEYS.every((k) => c.canonStats[k] === canon[k]);
    }), `no concept with canonStats ${spread.join('-')} on ${style}`).toBe(true);
  });

  it.each(CANON_SPREADS)('each 84-pt canonStats sums to 84', ({ spread }) => {
    expect(spread.reduce((a, b) => a + b, 0)).toBe(84);
  });

  it('every new concept scales to the 70-pt budget within clamps', () => {
    for (const { style } of CANON_SPREADS) {
      for (const c of FIGHTER_CONCEPTS[style].concepts) {
        expect(sum(c.stats), `${style} ${c.name}`).toBe(ATTRIBUTE_TOTAL);
        for (const k of ATTRIBUTE_KEYS) {
          expect(c.stats[k]).toBeGreaterThanOrEqual(ATTRIBUTE_MIN);
          expect(c.stats[k]).toBeLessThanOrEqual(ATTRIBUTE_MAX);
        }
      }
    }
  });

  it('the flagship WS tank is a named, findable entry', () => {
    const ws = FIGHTER_CONCEPTS[FightingStyle.WallOfSteel].concepts;
    expect(
      ws.some((c) => c.canonStats.ST === 21 && c.canonStats.CN === 15 && c.canonStats.SP === 13),
      'flagship 21-15-6-11-7-13-11 not found'
    ).toBe(true);
  });

  it('the marginal PR is documented honestly (Assur: not recommended)', () => {
    const pr = FIGHTER_CONCEPTS[FightingStyle.ParryRiposte].concepts.find(
      (c) => c.canonStats.ST === 21 && c.canonStats.CN === 11
    );
    expect(pr).toBeDefined();
    expect(pr!.notes).toMatch(/marginal|not recommend|caution|con/i);
  });
});
