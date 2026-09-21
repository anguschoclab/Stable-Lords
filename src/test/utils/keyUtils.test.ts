import { describe, it, expect } from 'vitest';
import { getPairKey } from '@/utils/keyUtils';

describe('keyUtils', () => {
  describe('getPairKey', () => {
    it('returns consistent key regardless of argument order', () => {
      expect(getPairKey('A', 'B')).toBe('A|B');
      expect(getPairKey('B', 'A')).toBe('A|B');
    });

    it('returns same-id key when both ids are identical', () => {
      expect(getPairKey('X', 'X')).toBe('X|X');
    });
  });
});
