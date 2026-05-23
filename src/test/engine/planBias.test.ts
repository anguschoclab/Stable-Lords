/**
 * Plan Bias Tests
 */
import { describe, it, expect } from 'vitest';
import { autoTuneFromBias, reconcileGearTwoHanded, type Bias } from '@/engine/planBias';
import { FightingStyle, type FightPlan } from '@/types/game';
import type { EquipmentLoadout } from '@/data/equipment';

describe('Plan Bias', () => {
  describe('autoTuneFromBias', () => {
    const basePlan: FightPlan = {
      OE: 5,
      AL: 5,
      killDesire: 5,
      style: FightingStyle.StrikingAttack,
      target: 'Any',
      offensiveTactic: 'none',
      defensiveTactic: 'none',
    };

    it('should set head targeting for head-hunt bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'head-hunt');
      expect(tuned.target).toBe('Head');
    });

    it('should increase kill desire for head-hunt bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'head-hunt');
      expect(tuned.killDesire).toBeGreaterThanOrEqual(7);
    });

    it('should set leg targeting for hamstring bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'hamstring');
      expect(tuned.target).toBe('Right Leg');
    });

    it('should increase AL for hamstring bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'hamstring');
      expect(tuned.AL).toBeGreaterThanOrEqual(7);
    });

    it('should set abdomen targeting for gut bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'gut');
      expect(tuned.target).toBe('Abdomen');
    });

    it('should increase OE for gut bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'gut');
      expect(tuned.OE).toBeGreaterThanOrEqual(7);
    });

    it('should set arm targeting for guard-break bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'guard-break');
      expect(tuned.target).toBe('Right Arm');
    });

    it('should increase OE for guard-break bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'guard-break');
      expect(tuned.OE).toBeGreaterThanOrEqual(8);
    });

    it('should set Any target for balanced bias', () => {
      const tuned = autoTuneFromBias(basePlan, 'balanced');
      expect(tuned.target).toBe('Any');
    });

    it('should suggest Lunge for lunging styles', () => {
      const lungePlan: FightPlan = { ...basePlan, style: FightingStyle.LungingAttack };
      const tuned = autoTuneFromBias(lungePlan, 'balanced');
      expect(tuned.offensiveTactic).toBe('Lunge');
    });

    it('should suggest Bash for bashing styles', () => {
      const bashPlan: FightPlan = { ...basePlan, style: FightingStyle.BashingAttack };
      const tuned = autoTuneFromBias(bashPlan, 'balanced');
      // FightingStyle.BashingAttack = "BASHING ATTACK" matches /BASHING/
      expect(tuned.offensiveTactic).toBe('Bash');
    });

    it('should suggest Riposte for Parry-Riposte style', () => {
      const ripostePlan: FightPlan = { ...basePlan, style: FightingStyle.ParryRiposte };
      const tuned = autoTuneFromBias(ripostePlan, 'balanced');
      expect(tuned.defensiveTactic).toBe('Riposte');
    });

    it('should suggest Parry for Total Parry style', () => {
      const parryPlan: FightPlan = { ...basePlan, style: FightingStyle.TotalParry };
      const tuned = autoTuneFromBias(parryPlan, 'balanced');
      expect(tuned.defensiveTactic).toBe('Parry');
    });

    it('should not override existing high values', () => {
      const highKDPlan: FightPlan = { ...basePlan, killDesire: 9 };
      const tuned = autoTuneFromBias(highKDPlan, 'head-hunt');
      expect(tuned.killDesire).toBeGreaterThanOrEqual(9);
    });

    it('should not override existing high AL', () => {
      const highALPlan: FightPlan = { ...basePlan, AL: 9 };
      const tuned = autoTuneFromBias(highALPlan, 'hamstring');
      expect(tuned.AL).toBeGreaterThanOrEqual(9);
    });

    it('should not override existing high OE', () => {
      const highOEPlan: FightPlan = { ...basePlan, OE: 9 };
      const tuned = autoTuneFromBias(highOEPlan, 'gut');
      expect(tuned.OE).toBeGreaterThanOrEqual(9);
    });
  });

  describe('reconcileGearTwoHanded', () => {
    it('should remove shield when weapon is two-handed', () => {
      const equipment: EquipmentLoadout = {
        weapon: 'greatsword',  // two-handed weapon ID
        shield: 'large_shield',
        armor: 'leather',
        helm: 'none_helm',
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(draft, equipment);

      expect(draft.equipment?.shield).toBe('none_shield');
    });

    it('should not modify equipment if weapon is one-handed', () => {
      const equipment: EquipmentLoadout = {
        weapon: 'broadsword',  // one-handed weapon ID
        shield: 'medium_shield',
        armor: 'leather',
        helm: 'none_helm',
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(draft, equipment);

      expect(draft.equipment).toBeUndefined();
    });

    it('should not modify equipment if no shield equipped', () => {
      const equipment: EquipmentLoadout = {
        weapon: 'greatsword',  // two-handed weapon ID
        shield: 'none_shield',
        armor: 'leather',
        helm: 'none_helm',
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(draft, equipment);

      expect(draft.equipment).toBeUndefined();
    });

    it('should handle missing equipment gracefully', () => {
      const draft: Partial<FightPlan> = {};
      expect(() => reconcileGearTwoHanded(draft)).not.toThrow();
    });

    it('should preserve other equipment properties when removing shield', () => {
      const equipment: EquipmentLoadout = {
        weapon: 'greatsword',  // two-handed weapon ID
        shield: 'large_shield',
        armor: 'plate',
        helm: 'none_helm',
      };

      const draft: Partial<FightPlan> = {};
      reconcileGearTwoHanded(draft, equipment);

      expect(draft.equipment?.weapon).toBe('greatsword');
      expect(draft.equipment?.armor).toBe('plate');
      expect(draft.equipment?.helm).toBe('none_helm');
    });
  });
});
