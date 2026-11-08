/**
 * V24 canon — Pagan's tactic model (Arena 93): a tactic a style can never
 * roll as a favorite is UNSUITED and must net negative, not a shrunken bonus.
 * Consortium: double tactics are "very limiting". AI must not pick U.
 */
import { describe, it, expect } from 'vitest';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  doubleTacticSkillPenalty,
} from '@/engine/combat/mechanics/tacticResolution';
import {
  getOffensiveSuitability,
  getDefensiveSuitability,
} from '@/engine/strategy/tacticSuitability';
import {
  getBestOffensiveTactic,
  getBestDefensiveTactic,
} from '@/engine/ai/plan/tacticAdvisor';
import { FightingStyle } from '@/types/shared.types';
import type { OffensiveTactic, DefensiveTactic } from '@/types/combat.types';

const OFF_TACTICS: OffensiveTactic[] = ['Lunge', 'Slash', 'Bash', 'Decisiveness'];
const DEF_TACTICS: DefensiveTactic[] = ['Dodge', 'Parry', 'Riposte', 'Responsiveness'];
const STYLES = Object.values(FightingStyle);

const offNet = (m: { attBonus: number; dmgBonus: number; decBonus: number; parryBypass: number }) =>
  m.attBonus + m.dmgBonus + m.decBonus + m.parryBypass;
const defNet = (m: { parBonus: number; defBonus: number; ripBonus: number; iniBonus: number }) =>
  m.parBonus + m.defBonus + m.ripBonus + m.iniBonus;

describe('unsuited tactics are net-negative (Pagan: U drains more than it gives)', () => {
  for (const style of STYLES) {
    for (const t of OFF_TACTICS) {
      if (getOffensiveSuitability(style, t) !== 'U') continue;
      it(`${style} × ${t}: net bonus ≤ −1`, () => {
        expect(offNet(getOffensiveTacticMods(t, style))).toBeLessThanOrEqual(-1);
      });
    }
    for (const t of DEF_TACTICS) {
      if (getDefensiveSuitability(style, t) !== 'U') continue;
      it(`${style} × ${t}: net bonus ≤ −1`, () => {
        expect(defNet(getDefensiveTacticMods(t, style))).toBeLessThanOrEqual(-1);
      });
    }
  }

  it('WS tactics still give a real bonus', () => {
    expect(offNet(getOffensiveTacticMods('Decisiveness', FightingStyle.StrikingAttack)))
      .toBeGreaterThan(0);
    expect(defNet(getDefensiveTacticMods('Parry', FightingStyle.TotalParry)))
      .toBeGreaterThan(0);
  });
});

describe('double tactics are very limiting (Consortium canon)', () => {
  it('offensive + defensive tactic together tax every skill', () => {
    const p = doubleTacticSkillPenalty('Lunge', 'Parry');
    for (const k of Object.keys(p) as (keyof typeof p)[]) {
      expect(p[k]).toBe(-1);
    }
  });

  it('a single tactic incurs no tax', () => {
    for (const p of [
      doubleTacticSkillPenalty('Lunge', 'none' as DefensiveTactic),
      doubleTacticSkillPenalty('none' as OffensiveTactic, 'Parry'),
      doubleTacticSkillPenalty(undefined, undefined),
    ]) {
      for (const k of Object.keys(p) as (keyof typeof p)[]) expect(p[k]).toBe(0);
    }
  });
});

describe('AI never plans an unsuited tactic (regression lock)', () => {
  it('best-tactic picks are never U-rated', () => {
    for (const style of STYLES) {
      const off = getBestOffensiveTactic(style);
      const def = getBestDefensiveTactic(style);
      if (off !== 'none')
        expect(getOffensiveSuitability(style, off)).not.toBe('U');
      if (def !== 'none')
        expect(getDefensiveSuitability(style, def)).not.toBe('U');
    }
  });
});
