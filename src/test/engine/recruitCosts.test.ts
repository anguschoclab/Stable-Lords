import { describe, it, expect } from 'vitest';
import { TIER_COST } from '@/constants/recruitment/recruitment';

describe('Recruit costs — doc alignment', () => {
  it('Common costs 50g', () => {
    expect(TIER_COST.Common).toBe(50);
  });

  it('Promising costs 150g', () => {
    expect(TIER_COST.Promising).toBe(150);
  });

  it('Exceptional costs 300g', () => {
    expect(TIER_COST.Exceptional).toBe(300);
  });

  it('Prodigy costs 500g', () => {
    expect(TIER_COST.Prodigy).toBe(500);
  });
});
