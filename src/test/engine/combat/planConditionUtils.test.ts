import { describe, it, expect } from 'vitest';
import { triggerDisplayValue } from '@/engine/combat/planConditionUtils';
import type { PlanCondition } from '@/types/game';

describe('planConditionUtils', () => {
  describe('triggerDisplayValue', () => {
    it('returns percent format when inputType is percent', () => {
      const cond: PlanCondition = { trigger: { type: 'HP_BELOW', value: 50 }, override: { OE: 5 } };
      expect(triggerDisplayValue(cond)).toBe('50%');
    });

    it('returns string value when inputType is phase', () => {
      const cond: PlanCondition = { trigger: { type: 'PHASE_IS', value: 'mid' }, override: { AL: 3 } };
      expect(triggerDisplayValue(cond)).toBe('mid');
    });

    it('returns string value when no option is found', () => {
      const cond = { trigger: { type: 'unknown_type', value: 'custom_val' }, override: { killDesire: 5 } } as unknown as PlanCondition;
      expect(triggerDisplayValue(cond)).toBe('custom_val');
    });
  });
});
