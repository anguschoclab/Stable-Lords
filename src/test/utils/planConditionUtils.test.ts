import { describe, it, expect } from 'vitest';
import { triggerDisplayValue } from '@/utils/planConditionUtils';
import type { PlanCondition } from '@/types/game';

describe('planConditionUtils', () => {
  describe('triggerDisplayValue', () => {
    it('returns percent format when inputType is percent', () => {
      const cond: PlanCondition = { trigger: { type: 'HP_BELOW', value: 50 }, override: { type: 'stance', value: 'aggressive' } };
      expect(triggerDisplayValue(cond)).toBe('50%');
    });

    it('returns string value when inputType is phase', () => {
      const cond: PlanCondition = { trigger: { type: 'phase_is', value: 'mid' }, override: { type: 'stance', value: 'aggressive' } };
      expect(triggerDisplayValue(cond)).toBe('mid');
    });

    it('returns string value when no option is found', () => {
      const cond = { trigger: { type: 'unknown_type', value: 'custom_val' }, override: { type: 'stance', value: 'aggressive' } } as unknown as PlanCondition;
      expect(triggerDisplayValue(cond)).toBe('custom_val');
    });
  });
});
