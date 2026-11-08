// @vitest-environment node
/**
 * generateRecruitAttrs — style-aware stat weighting.
 *
 * World measurement (1000-wk oracle): WALL OF STEEL win rate collapsed to
 * ~31% because philosophy-biased attributes leave tank styles starved of
 * CN/WL/SZ. Recruit attrs now blend the style's canonical Arena-93 fighter
 * concept mean into the weighted pool (~50/50 philosophy/style) — recruits
 * trend toward their style's canon build (e.g. WS stays WT/WL-led, small;
 * LU stays WL-led) instead of a flat philosophy spread.
 */
import { describe, it, expect } from 'vitest';
import { generateRecruitAttrs } from '@/engine/owner/roster/recruitGenerator';
import { SeededRNG } from '@/utils/random';
import { FightingStyle } from '@/types/shared.types';

const SAMPLES = 60;

function meanAttrs(style?: FightingStyle) {
  const sums = { ST: 0, CN: 0, SZ: 0, WT: 0, WL: 0, SP: 0, DF: 0 };
  for (let i = 0; i < SAMPLES; i++) {
    const a = generateRecruitAttrs('Balanced', new SeededRNG(i * 31 + 7), style);
    for (const k of Object.keys(sums) as (keyof typeof sums)[]) sums[k] += a[k];
  }
  for (const k of Object.keys(sums) as (keyof typeof sums)[]) sums[k] /= SAMPLES;
  return sums;
}

describe('generateRecruitAttrs — style-aware blend', () => {
  it('WallOfSteel recruits trend toward the canon wall corpus', () => {
    const tank = meanAttrs(FightingStyle.WallOfSteel);
    const neutral = meanAttrs(undefined);
    // V25 corpus update: Assur's low-will tank line joined the WS concepts,
    // so the corpus is no longer uniformly will-first — the blend lifts
    // wit+will together, keeps deftness ahead of size on a small frame,
    // and starves speed.
    expect(tank.WL).toBeGreaterThan(neutral.WL);
    expect(tank.WT + tank.WL).toBeGreaterThan(neutral.WT + neutral.WL + 1);
    expect(tank.DF).toBeGreaterThan(tank.SZ);
    expect(tank.SP).toBeLessThan(neutral.SP);
  });

  it('LungingAttack recruits trend toward canon WT/WL', () => {
    const agile = meanAttrs(FightingStyle.LungingAttack);
    const neutral = meanAttrs(undefined);
    // Fifteen Arena-93 lunger spreads (Snorri/Boar/Assur) are will-led — the
    // endurance engine is the canon priority, with wit close behind.
    expect(agile.WT).toBeGreaterThan(neutral.WT + 1);
    expect(agile.WL).toBeGreaterThan(neutral.WL + 1);
  });

  it('StrikingAttack recruits trend toward canon WT', () => {
    const striker = meanAttrs(FightingStyle.StrikingAttack);
    const neutral = meanAttrs(undefined);
    // The striker concept pool is 31 canon Arena-93 builds — wit dominates
    // (17-21 everywhere) while DF sits at the canon minimum-11 band, a wash
    // against the neutral spread rather than a leadership trend.
    expect(striker.WT).toBeGreaterThan(neutral.WT + 1);
    expect(Math.abs(striker.DF - neutral.DF)).toBeLessThan(1);
  });

  it('style-less calls keep the philosophy-only distribution', () => {
    const a = generateRecruitAttrs('Brute Force', new SeededRNG(5));
    const b = generateRecruitAttrs('Brute Force', new SeededRNG(5));
    expect(a).toEqual(b); // deterministic
    const total = Object.values(a).reduce((s, v) => s + v, 0);
    expect(total).toBe(70); // point budget unchanged
  });

  it('style-aware draws also respect the 70-point budget', () => {
    for (const style of Object.values(FightingStyle)) {
      const a = generateRecruitAttrs('Balanced', new SeededRNG(9), style);
      expect(Object.values(a).reduce((s, v) => s + v, 0)).toBe(70);
    }
  });
});
