import { describe, it, expect } from 'vitest';
import { getPairKey, getStablePairKey, getWarriorPairKey } from '@/utils/keyUtils';

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

  describe('getStablePairKey', () => {
    it('returns consistent key regardless of argument order', () => {
      expect(getStablePairKey('A', 'B')).toBe('A|B');
      expect(getStablePairKey('B', 'A')).toBe('A|B');
    });
  });

  describe('getWarriorPairKey', () => {
    it('returns consistent key regardless of argument order', () => {
      expect(getWarriorPairKey('w1', 'w2')).toBe('w1|w2');
      expect(getWarriorPairKey('w2', 'w1')).toBe('w1|w2');
    });
  });
});
