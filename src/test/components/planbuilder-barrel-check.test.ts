// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { TacticBank, CommonControls, SpatialControls, PhaseOverrides, StylePassives, ContingencyPlans, StaminaCurve } from '@/components/planBuilder';

describe('planBuilder barrel', () => {
  it('all exports defined', () => {
    console.log('TacticBank:', typeof TacticBank);
    console.log('CommonControls:', typeof CommonControls);
    console.log('SpatialControls:', typeof SpatialControls);
    console.log('PhaseOverrides:', typeof PhaseOverrides);
    console.log('StylePassives:', typeof StylePassives);
    console.log('ContingencyPlans:', typeof ContingencyPlans);
    console.log('StaminaCurve:', typeof StaminaCurve);
    expect(typeof TacticBank).toBe('function');
    expect(typeof ContingencyPlans).toBe('function');
  });
});
