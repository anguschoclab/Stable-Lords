import { describe, it, expect } from 'vitest';
import { accumulateGuardBreak } from '@/engine/combat/resolution/guardBreak';
import { BA_PARDEGRADE_PER_HIT, BA_PARDEGRADE_CAP } from '@/constants/combat/combat';

describe('Guard Break Mechanics', () => {
  describe('accumulateGuardBreak', () => {
    it('adds penalty normally when below cap', () => {
      const current = 1;
      const result = accumulateGuardBreak(current);
      expect(result).toBe(current + BA_PARDEGRADE_PER_HIT);
    });

    it('caps penalty correctly', () => {
      const current = BA_PARDEGRADE_CAP - (BA_PARDEGRADE_PER_HIT / 2);
      const result = accumulateGuardBreak(current);
      expect(result).toBe(BA_PARDEGRADE_CAP);
    });

    it('does not exceed cap if already at cap', () => {
      const result = accumulateGuardBreak(BA_PARDEGRADE_CAP);
      expect(result).toBe(BA_PARDEGRADE_CAP);
    });
  });
});
