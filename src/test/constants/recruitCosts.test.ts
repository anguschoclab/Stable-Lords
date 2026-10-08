import { describe, it, expect } from 'vitest';
import { TIER_COST } from '@/constants/recruitment/recruitment';

describe('Recruit costs — doc alignment', () => {
  it('Common costs 100g', () => {
    expect(TIER_COST.Common).toBe(100);
  });

  it('Promising costs 150g', () => {
    expect(TIER_COST.Promising).toBe(150);
  });

  it('Exceptional costs 250g', () => {
    expect(TIER_COST.Exceptional).toBe(250);
  });

  it('Prodigy costs 400g', () => {
    expect(TIER_COST.Prodigy).toBe(400);
  });
});
