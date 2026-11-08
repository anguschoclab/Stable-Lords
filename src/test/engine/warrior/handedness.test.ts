/**
 * V22 canon handedness specs — Noblish Island: ~85% right / ~7.5% left /
 * ~7.5% ambidextrous; ambidextrous adds +1 ATT at creation and eases
 * dual-wield deftness requirements.
 */
import { describe, it, expect } from 'vitest';
import { SeededRNG } from '@/utils/random';
import { rollHandedness } from '@/engine/warrior/skillCalc';
import { checkWeaponRequirements } from '@/data/equipment';
import { generateWarriorIntro } from '@/engine/narrative/narrativeIntro';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/shared.types';

describe('rollHandedness — canon distribution', () => {
  it('produces right/left/ambidextrous with canonical rates', () => {
    const counts = { right: 0, left: 0, ambidextrous: 0 };
    const N = 4000;
    const rng = new SeededRNG(1234);
    for (let i = 0; i < N; i++) counts[rollHandedness(rng)]++;
    // Canon: 85% right; ~7.5% each left/ambi. Wide bands for seed noise.
    expect(counts.right / N).toBeGreaterThan(0.78);
    expect(counts.right / N).toBeLessThan(0.92);
    expect(counts.left / N).toBeGreaterThan(0.03);
    expect(counts.left / N).toBeLessThan(0.13);
    expect(counts.ambidextrous / N).toBeGreaterThan(0.03);
    expect(counts.ambidextrous / N).toBeLessThan(0.13);
  });

  it('is deterministic for a given seed', () => {
    expect(rollHandedness(new SeededRNG(99))).toBe(rollHandedness(new SeededRNG(99)));
  });
});

describe('ambidextrous weapon-requirement easing (live path)', () => {
  const attrs: Attributes = { ST: 15, CN: 10, SZ: 10, WT: 15, WL: 10, SP: 10, DF: 18 };

  it('an ambidextrous warrior meets eased dual-wield deftness reqs', () => {
    // Dual epees: canon DF 22, or DF 17-21 when ambidextrous.
    const normal = checkWeaponRequirements('epee', attrs, { wield: 'dual' });
    const ambi = checkWeaponRequirements('epee', attrs, {
      wield: 'dual',
      ambidextrous: true,
    });
    expect(ambi.met).toBe(true);
    expect(normal.met).toBe(false);
  });
});

describe('warrior intro handedness — persisted, not re-rolled', () => {
  it('uses the warrior handedness override when provided', () => {
    const rng = new SeededRNG(1);
    const lines = generateWarriorIntro(
      rng,
      { name: 'Test', style: FightingStyle.StrikingAttack, handedness: 'ambidextrous' },
      12
    );
    expect(lines.some((l) => l.includes('ambidextrous'))).toBe(true);
  });
});
