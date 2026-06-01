/**
 * Tactic Resolution — OE/AL modifiers and tactic effectiveness calculations.
 */
import { describe, it, expect } from 'vitest';
import {
  oeAttMod,
  oeDefMod,
  alIniMod,
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
} from '@/engine/combat/mechanics/tacticResolution';
import { FightingStyle, type FightPlan } from '@/types/shared.types';

describe('tacticResolution', () => {
  describe('oeAttMod', () => {
    it('returns 0 at neutral OE=5', () => {
      expect(oeAttMod(5)).toBe(0);
    });

    it('returns positive modifier for sufficiently high OE', () => {
      // OE_ATT_SCALING = 0.85, so need OE >= 7 to get +1 (Math.floor(1.7) = 1)
      expect(oeAttMod(7)).toBeGreaterThanOrEqual(1);
      expect(oeAttMod(10)).toBeGreaterThanOrEqual(4);
    });

    it('returns negative modifier for sufficiently low OE', () => {
      // OE_ATT_SCALING = 0.85, so need OE <= 3 to get -1 (Math.floor(-1.7) = -1)
      expect(oeAttMod(3)).toBeLessThanOrEqual(-1);
      expect(oeAttMod(1)).toBeLessThanOrEqual(-3);
    });

    it('adds +1 for aggressive styles (Bashing, Slashing, Striking)', () => {
      const baseMod = oeAttMod(8);
      expect(oeAttMod(8, FightingStyle.BashingAttack)).toBe(baseMod + 1);
      expect(oeAttMod(8, FightingStyle.SlashingAttack)).toBe(baseMod + 1);
      expect(oeAttMod(8, FightingStyle.StrikingAttack)).toBe(baseMod + 1);
    });

    it('does not add bonus for non-aggressive styles', () => {
      const baseMod = oeAttMod(8);
      expect(oeAttMod(8, FightingStyle.TotalParry)).toBe(baseMod);
      expect(oeAttMod(8, FightingStyle.WallOfSteel)).toBe(baseMod);
    });

    it('handles boundary OE values', () => {
      expect(oeAttMod(1)).toBeDefined();
      expect(oeAttMod(10)).toBeDefined();
    });
  });

  describe('oeDefMod', () => {
    it('returns 0 at neutral OE=5', () => {
      expect(oeDefMod(5)).toBe(0);
    });

    it('returns positive modifier (defense bonus) for sufficiently low OE', () => {
      // OE_DEF_SCALING = 0.5, so need OE <= 3 to get +1 (Math.floor(1.0) = 1)
      expect(oeDefMod(3)).toBeGreaterThanOrEqual(1);
      expect(oeDefMod(1)).toBeGreaterThanOrEqual(2);
    });

    it('returns negative modifier (defense penalty) for sufficiently high OE', () => {
      // OE_DEF_SCALING = 0.5, so need OE >= 7 to get -1 (Math.floor(1.0) = 1, then negated)
      expect(oeDefMod(7)).toBeLessThanOrEqual(-1);
      expect(oeDefMod(10)).toBeLessThanOrEqual(-2);
    });

    it('returns symmetric values for equidistant OE values', () => {
      expect(oeDefMod(4)).toBe(Math.abs(oeDefMod(6)));
      expect(oeDefMod(3)).toBe(Math.abs(oeDefMod(7)));
      expect(oeDefMod(1)).toBe(Math.abs(oeDefMod(9)));
    });
  });

  describe('alIniMod', () => {
    it('returns 0 at neutral AL=5', () => {
      expect(alIniMod(5)).toBe(0);
    });

    it('returns positive modifier for sufficiently high AL', () => {
      // AL_INI_SCALING = 0.7, so need AL >= 7 to get +1 (Math.floor(1.4) = 1)
      expect(alIniMod(7)).toBeGreaterThanOrEqual(1);
      expect(alIniMod(10)).toBeGreaterThanOrEqual(3);
    });

    it('returns negative modifier for AL < 5', () => {
      expect(alIniMod(4)).toBeLessThan(0);
      expect(alIniMod(1)).toBeLessThan(0);
    });

    it('returns mirrored but not perfectly symmetric values due to floor', () => {
      // AL_INI_SCALING = 0.7
      // Due to Math.floor, values aren't perfectly symmetric:
      // AL=1: floor(-2.8)=-3, AL=9: floor(2.8)=2 (magnitude differs by 1)
      // AL=3: floor(-1.4)=-2, AL=7: floor(1.4)=1 (magnitude differs by 1)
      expect(alIniMod(1)).toBeLessThan(0);
      expect(alIniMod(9)).toBeGreaterThan(0);
      expect(Math.abs(alIniMod(1)) - Math.abs(alIniMod(9))).toBeLessThanOrEqual(1);
    });
  });

  describe('getOffensiveTacticMods', () => {
    it('returns zero modifiers for undefined tactic', () => {
      const mods = getOffensiveTacticMods(undefined, FightingStyle.StrikingAttack);
      expect(mods.attBonus).toBe(0);
      expect(mods.dmgBonus).toBe(0);
      expect(mods.defPenalty).toBe(0);
    });

    it('returns zero modifiers for none tactic', () => {
      const mods = getOffensiveTacticMods('none', FightingStyle.StrikingAttack);
      expect(mods.attBonus).toBe(0);
      expect(mods.dmgBonus).toBe(0);
      expect(mods.defPenalty).toBe(0);
    });

    it('returns Lunge mods with attack bonus and defense penalty', () => {
      const mods = getOffensiveTacticMods('Lunge', FightingStyle.LungingAttack);
      expect(mods.attBonus).toBeGreaterThan(0);
      expect(mods.defPenalty).toBeGreaterThan(0);
      expect(mods.endCost).toBe(2);
    });

    it('returns Slash mods with damage bonus and parry bypass', () => {
      const mods = getOffensiveTacticMods('Slash', FightingStyle.SlashingAttack);
      expect(mods.dmgBonus).toBeGreaterThan(0);
      expect(mods.parryBypass).toBeGreaterThan(0);
      expect(mods.endCost).toBe(1);
    });

    it('returns Bash mods with high parry bypass', () => {
      const mods = getOffensiveTacticMods('Bash', FightingStyle.BashingAttack);
      expect(mods.attBonus).toBeGreaterThan(0);
      expect(mods.dmgBonus).toBeGreaterThan(0);
      expect(mods.parryBypass).toBeGreaterThan(mods.attBonus);
      expect(mods.endCost).toBe(2);
    });

    it('returns Decisiveness mods with decBonus', () => {
      const mods = getOffensiveTacticMods('Decisiveness', FightingStyle.AimedBlow);
      expect(mods.decBonus).toBeGreaterThan(0);
      expect(mods.attBonus).toBe(0);
      expect(mods.dmgBonus).toBe(0);
      expect(mods.endCost).toBe(1);
    });

    it('scales mods by style suitability', () => {
      // Same tactic with different style suitability should produce different mod values
      const lungeLA = getOffensiveTacticMods('Lunge', FightingStyle.LungingAttack);
      const lungeBA = getOffensiveTacticMods('Lunge', FightingStyle.BashingAttack);
      // LungingAttack should have better suitability for Lunge than BashingAttack
      expect(lungeLA.attBonus).not.toBe(lungeBA.attBonus);
    });
  });

  describe('getDefensiveTacticMods', () => {
    it('returns zero modifiers for undefined tactic', () => {
      const mods = getDefensiveTacticMods(undefined, FightingStyle.StrikingAttack);
      expect(mods.parBonus).toBe(0);
      expect(mods.defBonus).toBe(0);
      expect(mods.ripBonus).toBe(0);
    });

    it('returns zero modifiers for none tactic', () => {
      const mods = getDefensiveTacticMods('none', FightingStyle.StrikingAttack);
      expect(mods.parBonus).toBe(0);
      expect(mods.defBonus).toBe(0);
      expect(mods.ripBonus).toBe(0);
    });

    it('returns Parry mods with high parry bonus', () => {
      const mods = getDefensiveTacticMods('Parry', FightingStyle.ParryRiposte);
      expect(mods.parBonus).toBeGreaterThan(0);
      expect(mods.ripBonus).toBeLessThan(0); // Parry penalizes riposte
    });

    it('returns Dodge mods with high defense bonus', () => {
      const mods = getDefensiveTacticMods('Dodge', FightingStyle.LungingAttack);
      expect(mods.defBonus).toBeGreaterThan(0);
      expect(mods.parBonus).toBeLessThan(0); // Dodge penalizes parry
    });

    it('returns Riposte mods with high riposte bonus', () => {
      const mods = getDefensiveTacticMods('Riposte', FightingStyle.ParryRiposte);
      expect(mods.ripBonus).toBeGreaterThan(0);
      expect(mods.parBonus).toBeGreaterThan(0);
    });

    it('returns Responsiveness mods with initiative bonus', () => {
      const mods = getDefensiveTacticMods('Responsiveness', FightingStyle.AimedBlow);
      expect(mods.iniBonus).toBeGreaterThan(0);
      expect(mods.parBonus).toBe(0);
      expect(mods.defBonus).toBe(0);
      expect(mods.ripBonus).toBe(0);
    });

    it('scales mods by style suitability', () => {
      const parryPR = getDefensiveTacticMods('Parry', FightingStyle.ParryRiposte);
      const parryBA = getDefensiveTacticMods('Parry', FightingStyle.BashingAttack);
      // ParryRiposte should have better suitability for Parry than BashingAttack
      expect(parryPR.parBonus).not.toBe(parryBA.parBonus);
    });
  });

  describe('calculateFinalOEAL', () => {
    const basePlan: FightPlan = {
      style: FightingStyle.StrikingAttack,
      OE: 5,
      AL: 5,
      killDesire: 5,
    };

    it('returns base OE/AL when no modifiers apply', () => {
      const [finalOE, finalAL] = calculateFinalOEAL(5, 5, basePlan, 100, 100, 100, 100, 5);
      expect(finalOE).toBe(5);
      expect(finalAL).toBe(5);
    });

    it('applies Aggressive openingMove bonus in early exchanges', () => {
      const plan: FightPlan = { ...basePlan, openingMove: 'Aggressive' };
      const [oe1, al1] = calculateFinalOEAL(5, 5, plan, 100, 100, 100, 100, 1);
      const [oe2, al2] = calculateFinalOEAL(5, 5, plan, 100, 100, 100, 100, 2);
      expect(oe1).toBe(6); // +1 for Aggressive
      expect(al1).toBe(6);
      expect(oe2).toBe(6); // Still early exchange
      expect(al2).toBe(6);
    });

    it('does not apply openingMove after exchange 3', () => {
      const plan: FightPlan = { ...basePlan, openingMove: 'Aggressive' };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 100, 100, 100, 100, 3);
      expect(oe).toBe(5); // No bonus
      expect(al).toBe(5);
    });

    it('applies Safe openingMove penalty in early exchanges', () => {
      const plan: FightPlan = { ...basePlan, openingMove: 'Safe' };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 100, 100, 100, 100, 1);
      expect(oe).toBe(4); // -1 for Safe
      expect(al).toBe(4);
    });

    it('applies FLEE fallback when HP < 30%', () => {
      const plan: FightPlan = { ...basePlan, fallbackCondition: 'FLEE' };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 25, 100, 100, 100, 5);
      expect(oe).toBe(2); // 5 - 3 = 2
      expect(al).toBe(2);
    });

    it('does not apply FLEE fallback when HP >= 30%', () => {
      const plan: FightPlan = { ...basePlan, fallbackCondition: 'FLEE' };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 30, 100, 100, 100, 5);
      expect(oe).toBe(5);
      expect(al).toBe(5);
    });

    it('applies TURTLE fallback when endurance < 30%', () => {
      const plan: FightPlan = { ...basePlan, fallbackCondition: 'TURTLE' };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 100, 100, 25, 100, 5);
      expect(oe).toBe(1); // 5 - 4 = 1
      expect(al).toBe(7); // 5 + 2 = 7
    });

    it('applies BERZERK fallback when HP < 30%', () => {
      const plan: FightPlan = { ...basePlan, fallbackCondition: 'BERZERK' };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 25, 100, 100, 100, 5);
      expect(oe).toBe(9); // 5 + 4 = 9
      expect(al).toBe(3); // 5 - 2 = 3
    });

    it('clamps final OE/AL between 1 and 10', () => {
      const plan: FightPlan = { ...basePlan, fallbackCondition: 'BERZERK' };
      const [oe, al] = calculateFinalOEAL(8, 1, plan, 25, 100, 100, 100, 5);
      expect(oe).toBe(10); // 8 + 4 = 12, clamped to 10
      expect(al).toBe(1); // 1 - 2 = -1, clamped to 1
    });

    it('combines openingMove and fallback modifiers', () => {
      const plan: FightPlan = {
        ...basePlan,
        openingMove: 'Aggressive',
        fallbackCondition: 'FLEE',
      };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 25, 100, 100, 100, 1);
      // Aggressive: +1, FLEE: -3 = net -2
      expect(oe).toBe(3);
      expect(al).toBe(3);
    });

    it('uses effective OE/AL as base, not plan values', () => {
      const plan: FightPlan = { ...basePlan, OE: 7, AL: 3 };
      const [oe, al] = calculateFinalOEAL(5, 5, plan, 100, 100, 100, 100, 5);
      // Uses effOE=5, effAL=5, not plan.OE=7, plan.AL=3
      expect(oe).toBe(5);
      expect(al).toBe(5);
    });
  });
});
