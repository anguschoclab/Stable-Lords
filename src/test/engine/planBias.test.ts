import { describe, it, expect } from 'vitest';
import { autoTuneFromBias, reconcileGearTwoHanded } from '@/engine/planBias';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';
import type { EquipmentLoadout } from '@/data/equipment';

describe('planBias Utilities', () => {
  describe('autoTuneFromBias', () => {
    it('applies head-hunt bias correctly', () => {
      const plan = { killDesire: 5, style: FightingStyle.SlashingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'head-hunt');
      expect(tuned.target).toBe('Head');
      expect(tuned.killDesire).toBe(7);
    });

    it('applies hamstring bias correctly', () => {
      const plan = { AL: 4, style: FightingStyle.SlashingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'hamstring');
      expect(tuned.target).toBe('Right Leg');
      expect(tuned.AL).toBe(7);
    });

    it('applies gut bias correctly', () => {
      const plan = { OE: 3, style: FightingStyle.SlashingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'gut');
      expect(tuned.target).toBe('Abdomen');
      expect(tuned.OE).toBe(7);
    });

    it('applies guard-break bias correctly', () => {
      const plan = { OE: 5, style: FightingStyle.SlashingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'guard-break');
      expect(tuned.target).toBe('Right Arm');
      expect(tuned.OE).toBe(8);
    });

    it('applies balanced bias correctly', () => {
      const plan = { style: FightingStyle.SlashingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'balanced');
      expect(tuned.target).toBe('Any');
    });

    it('adds style nudges correctly for LungingAttack', () => {
      const plan = { style: FightingStyle.LungingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'balanced');
      expect(tuned.offensiveTactic).toBe('Lunge');
    });

    it('adds style nudges correctly for BashingAttack', () => {
      const plan = { style: FightingStyle.BashingAttack } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'balanced');
      expect(tuned.offensiveTactic).toBe('Bash');
    });

    it('adds style nudges correctly for ParryRiposte', () => {
      const plan = { style: FightingStyle.ParryRiposte } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'balanced');
      expect(tuned.defensiveTactic).toBe('Riposte');
    });

    it('adds style nudges correctly for TotalParry', () => {
      const plan = { style: FightingStyle.TotalParry } as FightPlan;
      const tuned = autoTuneFromBias(plan, 'balanced');
      expect(tuned.defensiveTactic).toBe('Parry');
    });
  });

  describe('reconcileGearTwoHanded', () => {
    it('does nothing if no equipment is provided', () => {
      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(draft, undefined);
      expect(draft).toEqual({});
    });

    it('does nothing if weapon is not two-handed', () => {
      const draft: Partial<FightPlan> = {};
      // Assumes 'gladius' or similar is 1-handed in ALL_EQUIPMENT
      const eq = { weapon: 'gladius', shield: 'scutum' } as EquipmentLoadout;
      reconcileGearTwoHanded(draft, eq);
      expect(draft.equipment).toBeUndefined();
    });

    it('removes shield if weapon is two-handed', () => {
      const draft: Partial<FightPlan> = {};
      // Assumes 'greatsword' or similar is 2-handed in ALL_EQUIPMENT
      const eq = { weapon: 'greatsword', shield: 'buckler' } as EquipmentLoadout;
      reconcileGearTwoHanded(draft, eq);
      expect(draft.equipment?.shield).toBe('none_shield');
    });
  });
});
