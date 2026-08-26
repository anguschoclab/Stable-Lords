import { describe, it, expect } from 'vitest';
import { accumulateGuardBreak } from '@/engine/combat/resolution/guardBreak';

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
