/**
 * V24 canon — Rose of Shanon learning claims (Arena 93):
 *  - Burned skills shrink the effective learn cap (semantics, not canon
 *    literals — the engine's ladder is compressed: LEARN_PER_SKILL_CAP = 6).
 *  - CN grants no skills in any area (no CN rows in the breakpoint tables).
 *  - Kill intent is a kill-window input, not a style passive.
 */
import { describe, it, expect } from 'vitest';
import { effectiveLearnCap } from '@/engine/learning/skillBurn';
import { LEARN_PER_SKILL_CAP } from '@/constants/combat/combat/learn';
import { computeBaseSkills } from '@/engine/warrior/skillCalc';
import { calculateKillWindow } from '@/engine/combat/mechanics/damageCalc';
import { FightingStyle } from '@/types/shared.types';
import type { Attributes } from '@/types/warrior.types';

const attrs = (over: Partial<Attributes> = {}): Attributes => ({
  ST: 10,
  CN: 10,
  SZ: 10,
  WT: 10,
  WL: 10,
  SP: 10,
  DF: 10,
  ...over,
});

describe('burn shrinks the effective learn cap (canon semantics)', () => {
  it('each burn removes one effective learn slot', () => {
    const w = { burnedSkills: { ATT: 2 } };
    expect(effectiveLearnCap(w, 'ATT')).toBe(LEARN_PER_SKILL_CAP - 2);
    expect(effectiveLearnCap(w, 'PAR')).toBe(LEARN_PER_SKILL_CAP);
  });

  it('burns can take an area to zero — fully burned areas stop learning', () => {
    const w = { burnedSkills: { INI: LEARN_PER_SKILL_CAP } };
    expect(effectiveLearnCap(w, 'INI')).toBe(0);
  });
});

describe('CN grants no skills (Rose of Shanon)', () => {
  it('CN 3 vs CN 21 warriors have identical skill arrays', () => {
    for (const style of Object.values(FightingStyle)) {
      const low = computeBaseSkills(attrs({ CN: 3 }), style);
      const high = computeBaseSkills(attrs({ CN: 21 }), style);
      expect(low, `${style}: CN moved skills`).toEqual(high);
    }
  });
});

describe('kill window is a damage-roll mechanic (not a passive)', () => {
  it('higher kill intent never shrinks the window for the same state', () => {
    const base = {
      hpRatio: 0.5,
      enduranceRatio: 0.5,
      location: 'chest' as const,
      phaseLevel: 2,
    };
    const low = calculateKillWindow({ ...base, killDesire: 3 });
    const high = calculateKillWindow({ ...base, killDesire: 9 });
    expect(high).toBeGreaterThanOrEqual(low);
  });
});
