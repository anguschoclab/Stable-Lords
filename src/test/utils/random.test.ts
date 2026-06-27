import { describe, it, expect } from 'vitest';
import { SeededRNG, randomPick, stringToSeed, hashStr, shuffled } from '@/utils/random';

describe('SeededRNG', () => {
  it('produces deterministic results for the same seed', () => {
    const seed = 12345;
    const rng1 = new SeededRNG(seed);
    const rng2 = new SeededRNG(seed);

    for (let i = 0; i < 10; i++) {
      expect(rng1.roll(0, 100)).toBe(rng2.roll(0, 100));
    }
  });

  it('produces different results for different seeds', () => {
    const rng1 = new SeededRNG(1);
    const rng2 = new SeededRNG(2);

    let identical = true;
    for (let i = 0; i < 10; i++) {
      if (rng1.roll(0, 1) !== rng2.roll(0, 1)) {
        identical = false;
        break;
      }
    }
    expect(identical).toBe(false);
  });

  it('roll(min, max) returns values within range', () => {
    const rng = new SeededRNG(42);
    for (let i = 0; i < 100; i++) {
      const val = rng.roll(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
    }
  });

  it('pick(array) returns an element from the array', () => {
    const rng = new SeededRNG(42);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(rng.pick(arr));
    }
  });

  it('chance(probability) works correctly', () => {
    const rng = new SeededRNG(42);
    // chance(1) should always be true, chance(0) always false
    expect(rng.chance(1)).toBe(true);
    expect(rng.chance(0)).toBe(false);
  });
});

describe('randomPick', () => {
  it('works with function-based RNG', () => {
    let counter = 0;
    const rng = () => (counter++ % 3) / 3;
    const arr = ['a', 'b', 'c'];
    const result = randomPick(arr, rng);
    expect(arr).toContain(result);
  });

  it('throws on empty array', () => {
    const rng = () => 0.5;
    expect(() => randomPick([], rng)).toThrow('Cannot pick from empty array');
  });
});

describe('stringToSeed', () => {
  it('produces consistent seeds for same string', () => {
    const seed1 = stringToSeed('test');
    const seed2 = stringToSeed('test');
    expect(seed1).toBe(seed2);
  });

  it('produces different seeds for different strings', () => {
    const seed1 = stringToSeed('test');
    const seed2 = stringToSeed('different');
    expect(seed1).not.toBe(seed2);
  });

  it('returns positive numbers', () => {
    const seed = stringToSeed('any string');
    expect(seed).toBeGreaterThan(0);
  });
});

describe('hashStr', () => {
  it('produces consistent hashes for same string', () => {
    const hash1 = hashStr('test');
    const hash2 = hashStr('test');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different strings', () => {
    const hash1 = hashStr('test');
    const hash2 = hashStr('different');
    expect(hash1).not.toBe(hash2);
  });

  it('returns 32-bit unsigned integer', () => {
    const hash = hashStr('any string');
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThan(Math.pow(2, 32));
  });
});

describe('SeededRNG.next', () => {
  it('returns float in [0, 1) over many iterations', () => {
    const rng = new SeededRNG(99);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('is deterministic for same seed', () => {
    const rng1 = new SeededRNG(77);
    const rng2 = new SeededRNG(77);
    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });
});

describe('SeededRNG.shuffle', () => {
  it('returns a new array (not same reference)', () => {
    const rng = new SeededRNG(42);
    const arr = [1, 2, 3, 4, 5];
    const result = rng.shuffle(arr);
    expect(result).not.toBe(arr);
  });

  it('preserves all elements (same multiset)', () => {
    const rng = new SeededRNG(42);
    const arr = [1, 2, 3, 4, 5];
    const result = rng.shuffle(arr);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    expect(rng1.shuffle([1, 2, 3, 4, 5])).toEqual(rng2.shuffle([1, 2, 3, 4, 5]));
  });

  it('handles single-element array', () => {
    const rng = new SeededRNG(42);
    expect(rng.shuffle([1])).toEqual([1]);
  });

  it('handles empty array', () => {
    const rng = new SeededRNG(42);
    expect(rng.shuffle([])).toEqual([]);
  });
});

describe('SeededRNG.uuid', () => {
  it('returns 12-char hex string', () => {
    const rng = new SeededRNG(42);
    const id = rng.uuid();
    expect(id).toMatch(/^[0-9a-f]{12}$/);
  });

  it('with prefix returns prefixed hex string', () => {
    const rng = new SeededRNG(42);
    const id = rng.uuid('warrior');
    expect(id).toMatch(/^warrior-[0-9a-f]{12}$/);
  });

  it('is deterministic for same seed', () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);
    expect(rng1.uuid()).toBe(rng2.uuid());
  });
});

describe('SeededRNG.clone', () => {
  it('clone produces same sequence initially', () => {
    const rng = new SeededRNG(42);
    const clone = rng.clone();
    expect(clone.next()).toBe(rng.next());
  });

  it('clone is independent from original', () => {
    const rng = new SeededRNG(42);
    const clone = rng.clone();
    clone.next();
    // After advancing clone, original should not be affected
    const rngVal = rng.next();
    const cloneVal = clone.next();
    // They should differ because clone was advanced one extra time
    expect(rngVal).not.toBe(cloneVal);
  });
});

describe('SeededRNG.pickWeighted', () => {
  it('picks items proportional to weights', () => {
    const rng = new SeededRNG(42);
    const items = ['a', 'b'];
    const weights = [0, 100];
    // With all weight on 'b', should always pick 'b'
    for (let i = 0; i < 20; i++) {
      expect(rng.pickWeighted(items, weights)).toBe('b');
    }
  });

  it('throws on length mismatch', () => {
    const rng = new SeededRNG(42);
    expect(() => rng.pickWeighted(['a', 'b'], [1])).toThrow(
      'Items and weights must have same length'
    );
  });

  it('throws on empty arrays', () => {
    const rng = new SeededRNG(42);
    expect(() => rng.pickWeighted([], [])).toThrow('Cannot pick from empty array');
  });

  it('picks last item when all weight is on last', () => {
    const rng = new SeededRNG(42);
    const items = ['x', 'y', 'z'];
    const weights = [0, 0, 50];
    expect(rng.pickWeighted(items, weights)).toBe('z');
  });
});

describe('SeededRNG.pick', () => {
  it('throws on empty array', () => {
    const rng = new SeededRNG(42);
    expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
  });
});

describe('shuffled', () => {
  it('works with function-based RNG', () => {
    let counter = 0;
    const rng = () => (counter++ % 3) / 3;
    const result = shuffled([1, 2, 3], rng);
    expect(result.sort()).toEqual([1, 2, 3]);
  });

  it('works with IRNGService', () => {
    const rng = new SeededRNG(42);
    const result = shuffled([1, 2, 3, 4, 5], rng);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns a new array', () => {
    const rng = new SeededRNG(42);
    const arr = [1, 2, 3];
    expect(shuffled(arr, rng)).not.toBe(arr);
  });

  it('preserves all elements', () => {
    const rng = new SeededRNG(42);
    const arr = [1, 2, 3, 4, 5];
    const result = shuffled(arr, rng);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
