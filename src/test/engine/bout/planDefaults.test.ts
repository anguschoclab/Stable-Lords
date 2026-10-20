import { describe, it, expect } from 'vitest';
import { makeWtWarrior } from '@/test/_fixtures/factories';
import { defaultPlanForWarrior } from '@/engine/bout/planDefaults';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import { FightingStyle } from '@/types/shared.types';

describe('defaultPlanForWarrior', () => {
  describe('Preset-derived defaults', () => {
    it('returns a plan whose base OE/AL/KD match the default style preset', () => {
      for (const style of Object.values(FightingStyle)) {
        const warrior = makeWtWarrior(style);
        const plan = defaultPlanForWarrior(warrior);
        const presetPlan = defaultStylePreset(style).plan;
        expect(plan.style).toBe(style);
        expect(plan.OE).toBe(presetPlan.OE);
        expect(plan.AL).toBe(presetPlan.AL);
        expect(plan.killDesire).toBe(presetPlan.killDesire);
        expect(plan.offensiveTactic).toBe(presetPlan.offensiveTactic);
        expect(plan.defensiveTactic).toBe(presetPlan.defensiveTactic);
        expect(plan.target).toBe(presetPlan.target);
        expect(plan.protect).toBe(presetPlan.protect);
        expect(plan.phases).toBeUndefined();
      }
    });

    it('includes feintTendency derived from WT', () => {
      const warrior = makeWtWarrior(FightingStyle.AimedBlow, 18);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan.feintTendency).toBe(6);
    });

    it('sets feintTendency to 0 when WT < 15', () => {
      const warrior = makeWtWarrior(FightingStyle.AimedBlow, 10);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan.feintTendency).toBe(0);
    });
  });

  describe('Feint Tendency Logic', () => {
    it('sets feintTendency to 0 when WT is less than 15', () => {
      const warrior = makeWtWarrior(FightingStyle.AimedBlow, 14);
      const plan = defaultPlanForWarrior(warrior);
      expect(plan.feintTendency).toBe(0);
    });

    it('calculates feintTendency correctly when WT is 15', () => {
      const warrior = makeWtWarrior(FightingStyle.AimedBlow, 15);
      const plan = defaultPlanForWarrior(warrior);
      // Math.floor((15 - 14) * 1.5) = Math.floor(1.5) = 1
      expect(plan.feintTendency).toBe(1);
    });

    it('calculates feintTendency correctly when WT is 18', () => {
      const warrior = makeWtWarrior(FightingStyle.AimedBlow, 18);
      const plan = defaultPlanForWarrior(warrior);
      // Math.floor((18 - 14) * 1.5) = Math.floor(4 * 1.5) = Math.floor(6) = 6
      expect(plan.feintTendency).toBe(6);
    });

    it('caps feintTendency at 10 for very high WT', () => {
      const warrior = makeWtWarrior(FightingStyle.AimedBlow, 25);
      const plan = defaultPlanForWarrior(warrior);
      // Math.floor((25 - 14) * 1.5) = Math.floor(11 * 1.5) = Math.floor(16.5) = 16 => capped at 10
      expect(plan.feintTendency).toBe(10);
    });
  });
});
