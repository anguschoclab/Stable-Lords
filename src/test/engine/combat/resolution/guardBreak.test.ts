import { describe, it, expect } from 'vitest';
import { accumulateGuardBreak } from '@/engine/combat/resolution/guardBreak';
import { BA_PARDEGRADE_PER_HIT, BA_PARDEGRADE_CAP } from '@/constants/combat/combat';



describe('accumulateGuardBreak', () => {
  it('adds one increment from zero', () => {
    expect(accumulateGuardBreak(0)).toBe(BA_PARDEGRADE_PER_HIT);
  });

  it('accumulates across hits', () => {
    expect(accumulateGuardBreak(BA_PARDEGRADE_PER_HIT)).toBe(BA_PARDEGRADE_PER_HIT * 2);
  });

  it('clamps at the cap', () => {
    expect(accumulateGuardBreak(BA_PARDEGRADE_CAP)).toBe(BA_PARDEGRADE_CAP);
    expect(accumulateGuardBreak(BA_PARDEGRADE_CAP - 0.1)).toBe(BA_PARDEGRADE_CAP);
  });

  it('never exceeds the cap even from a large current value', () => {
    expect(accumulateGuardBreak(BA_PARDEGRADE_CAP + 5)).toBe(BA_PARDEGRADE_CAP);
  });
});

describe('Guard Break Mechanics', () => {
  describe('accumulateGuardBreak', () => {
    it('adds guard break penalty up to the cap (3)', () => {
      // 0 + 0.5 = 0.5
      expect(accumulateGuardBreak(0)).toBe(0.5);
      // 2 + 0.5 = 2.5
      expect(accumulateGuardBreak(2)).toBe(2.5);
      // 2.6 + 0.5 = 3.1, capped to 3
      expect(accumulateGuardBreak(2.6)).toBe(3);
      // 3 + 0.5 = 3.5, capped to 3
      expect(accumulateGuardBreak(3)).toBe(3);
    });
  });
});
