import { describe, it, expect, vi } from 'vitest';
import { biasedAttrs, createRivalWarrior } from '@/engine/rivals/rivalWarriorFactory';
import { FightingStyle } from '@/types/shared.types';

// Mock makeWarrior
vi.mock('@/engine/factories/warriorFactory', () => ({
  makeWarrior: vi.fn((wId, wName, style, attrs, info, rngWrapper) => ({
    id: wId,
    name: wName,
    style,
    attrs,
    info,
    _rngMocked: rngWrapper,
  })),
}));

describe('rivalWarriorFactory', () => {
  describe('biasedAttrs', () => {
    it('allocates exactly 70 total attributes (baseline 21 + 49 pool)', () => {
      // Return 0.5 to keep things predictable
      const attrs = biasedAttrs(() => 0.5, { ST: 1 });
      const total = Object.values(attrs).reduce((a, b) => a + b, 0);
      expect(total).toBe(70);
    });

    it('allocates correctly with a catchupPool', () => {
      const attrs = biasedAttrs(() => 0.5, { ST: 1 }, 10);
      const total = Object.values(attrs).reduce((a, b) => a + b, 0);
      expect(total).toBe(80);
    });

    it('respects the 25 stat cap', () => {
      // bias ST heavily
      const bias = { ST: 100, CN: 1 };
      // Force RNG to always pick ST (index 0..99)
      const attrs = biasedAttrs(() => 0.01, bias, 50); // Huge pool
      expect(attrs.ST).toBeLessThanOrEqual(25);
    });

    it('handles bias containing zero values', () => {
      const bias = { ST: 0, CN: 1 };
      const attrs = biasedAttrs(() => 0.99, bias);
      // ST should remain at base 3
      expect(attrs.ST).toBe(3);
    });

    it('handles floating point values properly in RNG', () => {
      // Should not throw out of bounds
      const attrs = biasedAttrs(() => 0.999999999, { ST: 1, CN: 1, SZ: 1 });
      expect(attrs).toBeDefined();
    });
  });

  describe('createRivalWarrior', () => {
    const mockRNG = {
      next: vi.fn(() => 0.5),
      pick: vi.fn(),
      roll: vi.fn(),
      uuid: vi.fn(),
      chance: vi.fn(),
      shuffle: vi.fn(),
      pickWeighted: vi.fn(),
    };

    it('creates a warrior and passes through basic info', () => {
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior(
        'w1',
        'Rival Bob',
        FightingStyle.StrikingAttack,
        attrs,
        's1',
        [10, 20],
        mockRNG
      ) as any;

      expect(warrior.id).toBe('w1');
      expect(warrior.name).toBe('Rival Bob');
      expect(warrior.style).toBe(FightingStyle.StrikingAttack);
      expect(warrior.attrs).toBe(attrs);
      expect(warrior.info.stableId).toBe('s1');
      // Fame is rng.next() * (20 - 10 + 1) + 10 => 0.5 * 11 + 10 = 15.5 => 15
      expect(warrior.info.fame).toBe(15);
      expect(warrior.info.popularity).toBe(2); // 0.5 * 5 = 2.5 => 2
    });

    it('rngWrapper.pick throws on empty array', () => {
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior('w1', 'Bob', FightingStyle.StrikingAttack, attrs, 's1', [10, 20], mockRNG) as any;
      expect(() => warrior._rngMocked.pick([])).toThrow('Cannot pick from empty array');
    });

    it('rngWrapper.pick selects correctly', () => {
      mockRNG.next.mockReturnValueOnce(0.5);
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior('w1', 'Bob', FightingStyle.StrikingAttack, attrs, 's1', [10, 20], mockRNG) as any;
      expect(warrior._rngMocked.pick(['a', 'b', 'c'])).toBe('b');
    });

    it('rngWrapper.roll rolls correctly', () => {
      mockRNG.next.mockReturnValueOnce(0.5);
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior('w1', 'Bob', FightingStyle.StrikingAttack, attrs, 's1', [10, 20], mockRNG) as any;
      expect(warrior._rngMocked.roll(1, 10)).toBe(6);
    });

    it('rngWrapper.shuffle shuffles correctly', () => {
      mockRNG.next.mockReturnValue(0.5);
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior('w1', 'Bob', FightingStyle.StrikingAttack, attrs, 's1', [10, 20], mockRNG) as any;
      const shuffled = warrior._rngMocked.shuffle(['a', 'b', 'c']);
      expect(shuffled.length).toBe(3);
      expect(shuffled).toContain('a');
      expect(shuffled).toContain('b');
      expect(shuffled).toContain('c');
    });

    it('rngWrapper.pickWeighted handles standard cases', () => {
      mockRNG.next.mockReturnValueOnce(0.2); // total weight is 10, random is 2. it should pick first element.
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior('w1', 'Bob', FightingStyle.StrikingAttack, attrs, 's1', [10, 20], mockRNG) as any;
      expect(warrior._rngMocked.pickWeighted(['a', 'b'], [5, 5])).toBe('a');
    });

    it('rngWrapper.pickWeighted hits fallback edge case on floating point inaccuracies', () => {
      // Mock random to be slightly higher than cumulative total to force fallback
      mockRNG.next.mockReturnValueOnce(1.0);
      const attrs = { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 };
      const warrior = createRivalWarrior('w1', 'Bob', FightingStyle.StrikingAttack, attrs, 's1', [10, 20], mockRNG) as any;
      expect(warrior._rngMocked.pickWeighted(['a', 'b'], [5, 5])).toBe('b');
    });
  });
});
