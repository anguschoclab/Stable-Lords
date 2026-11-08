/**
 * V24 canon — Assur's strategy sheet (Arena 93):
 *  - KD 9-10 makes a warrior "fight somewhat strangely" — a real efficacy tax.
 *  - The parry-based pure defensive ("scum") runs 1-1 Parry with a shield.
 *  - The dodge-based pure defensive runs moderate-high activity with Dodge.
 *  - Drake: a lunger can go "10-10-4 Dodge in desperation".
 */
import { describe, it, expect } from 'vitest';
import { STYLE_PRESETS } from '@/engine/bout/stylePresets';
import { killDesirePenalty } from '@/engine/combat/mechanics/tacticResolution';
import { FightingStyle } from '@/types/shared.types';

describe('KD 9-10 efficacy tax (Assur: "fights somewhat strangely")', () => {
  it('KD ≥ 9 carries an attack and initiative penalty', () => {
    for (const kd of [9, 10]) {
      const p = killDesirePenalty(kd);
      expect(p.attBonus).toBeLessThanOrEqual(-1);
      expect(p.iniBonus).toBeLessThanOrEqual(-1);
    }
  });

  it('KD 3-8 stays penalty-free', () => {
    for (const kd of [3, 5, 8]) {
      const p = killDesirePenalty(kd);
      expect(p.attBonus).toBe(0);
      expect(p.iniBonus).toBe(0);
    }
  });
});

describe('canon defensive presets', () => {
  it('TP gets a true scum sheet: 1 OE / 1 AL / Parry tactic', () => {
    const scum = STYLE_PRESETS[FightingStyle.TotalParry]?.find(
      (p) => p.name.toLowerCase().includes('scum')
    );
    expect(scum).toBeDefined();
    expect(scum?.plan.OE).toBe(1);
    expect(scum?.plan.AL).toBe(1);
    expect(scum?.plan.defensiveTactic).toBe('Parry');
  });

  it('PL gets a dodge-based defensive preset at moderate-high AL', () => {
    const dodger = STYLE_PRESETS[FightingStyle.ParryLunge]?.find(
      (p) => p.plan.defensiveTactic === 'Dodge'
    );
    expect(dodger).toBeDefined();
    expect(dodger?.plan.AL).toBeGreaterThanOrEqual(5);
  });

  it('LU carries a desperate 10-10-4 Dodge line (Drake)', () => {
    const lu = STYLE_PRESETS[FightingStyle.LungingAttack]?.find(
      (p) => p.plan.desperatePlan?.defensiveTactic === 'Dodge'
    );
    expect(lu).toBeDefined();
    expect(lu?.plan.desperatePlan?.OE).toBe(10);
    expect(lu?.plan.desperatePlan?.AL).toBe(10);
    expect(lu?.plan.desperatePlan?.killDesire).toBe(4);
  });
});
