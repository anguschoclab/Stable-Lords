// @vitest-environment node
/**
 * generateRecruitAttrs — style-aware stat weighting.
 *
 * World measurement (1000-wk oracle): WALL OF STEEL win rate collapsed to
 * ~31% because philosophy-biased attributes leave tank styles starved of
 * CN/WL/SZ. Recruit attrs now blend the style's archetype key-stats into the
 * weighted pool (~50/50 philosophy/style) — a 'tank' recruit should trend
 * toward CN/WL/SZ even under a neutral philosophy.
 */
import { describe, it, expect } from 'vitest';
import { generateRecruitAttrs } from '@/engine/owner/roster/recruitGenerator';
import { SeededRNGService } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

const SAMPLES = 60;

function meanAttrs(style?: FightingStyle) {
  const sums = { ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 };
  for (let i = 0; i < SAMPLES; i++) {
    const a = generateRecruitAttrs('Balanced', new SeededRNGService(i * 31 + 7), style);
    for (const k of Object.keys(sums) as (keyof typeof sums)[]) sums[k] += a[k];
  }
  for (const k of Object.keys(sums) as (keyof typeof sums)[]) sums[k] /= SAMPLES;
  return sums;
}

describe('generateRecruitAttrs — style-aware blend', () => {
  it('tank-style recruits (WallOfSteel) get elevated CN/WL/SZ', () => {
    const tank = meanAttrs(FightingStyle.WallOfSteel);
    const neutral = meanAttrs(undefined);
    // Tank highs (CN, WL, SZ) should each beat the style-blind baseline.
    expect(tank.CN).toBeGreaterThan(neutral.CN + 1);
    expect(tank.WL).toBeGreaterThan(neutral.WL + 1);
    expect(tank.SZ).toBeGreaterThan(neutral.SZ + 1);
  });

  it('agile-style recruits (LungingAttack) get elevated SP/DF/WT', () => {
    const agile = meanAttrs(FightingStyle.LungingAttack);
    const neutral = meanAttrs(undefined);
    expect(agile.SP).toBeGreaterThan(neutral.SP + 1);
    expect(agile.DF).toBeGreaterThan(neutral.DF + 1);
    expect(agile.WT).toBeGreaterThan(neutral.WT + 1);
  });

  it('style-less calls keep the philosophy-only distribution', () => {
    const a = generateRecruitAttrs('Brute Force', new SeededRNGService(5));
    const b = generateRecruitAttrs('Brute Force', new SeededRNGService(5));
    expect(a).toEqual(b); // deterministic
    const total = Object.values(a).reduce((s, v) => s + v, 0);
    expect(total).toBe(70); // point budget unchanged
  });

  it('style-aware draws also respect the 70-point budget', () => {
    for (const style of Object.values(FightingStyle)) {
      const a = generateRecruitAttrs('Balanced', new SeededRNGService(9), style);
      expect(Object.values(a).reduce((s, v) => s + v, 0)).toBe(70);
    }
  });
});
