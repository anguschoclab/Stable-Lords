import { describe, it, expect } from 'vitest';
import {
  buildPhasePlan,
  buildDesperatePlan,
  buildUniversalConditions,
} from '@/engine/ai/plan/phasePlanner';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';

describe('phasePlanner', () => {
  const basePlan: FightPlan = {
    style: FightingStyle.StrikingAttack,
    OE: 5,
    AL: 5,
    killDesire: 5,
    aggressionBias: 5,
  };

  describe('buildPhasePlan', () => {
    it('builds phase plan with conservative opening for balanced style', () => {
      const phases = buildPhasePlan(basePlan, 'Pragmatic', FightingStyle.StrikingAttack);

      // Opening
      expect(phases?.opening?.OE).toBe(4); // 5 - 1
      expect(phases?.opening?.AL).toBe(5);
      expect(phases?.opening?.killDesire).toBe(4);
      expect(phases?.opening?.aggressionBias).toBe(4); // 5 - 1

      // Mid
      expect(phases?.mid?.OE).toBe(5);
      expect(phases?.mid?.AL).toBe(5);
      expect(phases?.mid?.killDesire).toBe(5);
      expect(phases?.mid?.aggressionBias).toBe(5);

      // Late
      expect(phases?.late?.OE).toBe(5);
      expect(phases?.late?.AL).toBe(5);
      expect(phases?.late?.killDesire).toBe(5);
      expect(phases?.late?.aggressionBias).toBe(5);
    });

    it('builds phase plan with very conservative opening for defensive style', () => {
      const phases = buildPhasePlan(basePlan, 'Methodical', FightingStyle.TotalParry);

      // Opening
      expect(phases?.opening?.OE).toBe(3); // 5 - 2
      expect(phases?.opening?.AL).toBe(5);
    });

    it('scales up aggression late for Aggressive personalities', () => {
      const phases = buildPhasePlan(basePlan, 'Aggressive', FightingStyle.StrikingAttack);

      // Late
      expect(phases?.late?.OE).toBe(6); // 5 + 1
      expect(phases?.late?.AL).toBe(5);
      expect(phases?.late?.aggressionBias).toBe(6); // 5 + 1
    });

    it('scales up aggression late for Showman personalities', () => {
      const phases = buildPhasePlan(basePlan, 'Showman', FightingStyle.StrikingAttack);

      // Late
      expect(phases?.late?.OE).toBe(6);
      expect(phases?.late?.aggressionBias).toBe(6);
    });

    it('scales down aggression and up AL late for Methodical personalities', () => {
      const phases = buildPhasePlan(basePlan, 'Methodical', FightingStyle.StrikingAttack);

      // Late
      expect(phases?.late?.OE).toBe(4); // 5 - 1
      expect(phases?.late?.AL).toBe(6); // 5 + 1
      expect(phases?.late?.aggressionBias).toBe(5); // base
    });

    it('scales down aggression and up AL late for Tactician personalities', () => {
      const phases = buildPhasePlan(basePlan, 'Tactician', FightingStyle.StrikingAttack);

      // Late
      expect(phases?.late?.OE).toBe(4);
      expect(phases?.late?.AL).toBe(6);
    });

    it('clamps OE/AL correctly at boundaries', () => {
      const highPlan: FightPlan = { ...basePlan, OE: 10, AL: 10, aggressionBias: 10 };
      const phases = buildPhasePlan(highPlan, 'Aggressive', FightingStyle.StrikingAttack);

      // Late
      expect(phases?.late?.OE).toBe(10); // Not 11
      expect(phases?.late?.AL).toBe(10);
      expect(phases?.late?.aggressionBias).toBe(10); // Not 11
    });
  });

  describe('buildDesperatePlan', () => {
    it('returns hyper-aggressive desperate plan for Aggressive', () => {
      const plan = buildDesperatePlan(basePlan, 'Aggressive');
      expect(plan?.OE).toBe(4); // base 5 - 1
      expect(plan?.AL).toBe(6); // base 5 + 1
      expect(plan?.killDesire).toBe(6); // base 5 + 1
    });

    it('returns hyper-defensive desperate plan for Methodical', () => {
      const plan = buildDesperatePlan(basePlan, 'Methodical');
      expect(plan?.OE).toBe(1); // hardcoded 1
      expect(plan?.AL).toBe(8); // base 5 + 3
      expect(plan?.killDesire).toBe(3); // base 5 - 2
    });

    it('returns generic desperate plan for other personalities', () => {
      const plan = buildDesperatePlan(basePlan, 'Pragmatic');
      expect(plan?.OE).toBe(3); // base 5 - 2
      expect(plan?.AL).toBe(7); // base 5 + 2
      expect(plan?.killDesire).toBe(3); // base 5 - 2
    });

    it('clamps values correctly', () => {
      const edgePlan: FightPlan = { ...basePlan, OE: 1, AL: 10, killDesire: 10 };
      const plan = buildDesperatePlan(edgePlan, 'Aggressive');
      expect(plan?.OE).toBe(1); // Not 0
      expect(plan?.AL).toBe(10); // Not 11
      expect(plan?.killDesire).toBe(10); // Not 11
    });
  });

  describe('buildUniversalConditions', () => {
    it('returns critical endurance survival trigger', () => {
      const conditions = buildUniversalConditions(basePlan);
      expect(conditions).toHaveLength(1);

      const cond = conditions[0]!;
      expect(cond.trigger.type).toBe('ENDURANCE_BELOW');
      expect(cond.trigger.value).toBe(15);
      expect(cond.override.OE).toBe(3); // 5 - 2
      expect(cond.override.AL).toBe(7); // 5 + 2
    });

    it('clamps condition overrides', () => {
      const edgePlan: FightPlan = { ...basePlan, OE: 1, AL: 10 };
      const conditions = buildUniversalConditions(edgePlan);

      const cond = conditions[0]!;
      expect(cond.override.OE).toBe(1); // Not -1
      expect(cond.override.AL).toBe(10); // Not 12
    });
  });
});
