import { describe, it, expect } from 'vitest';
import {
  isDefined,
  isNil,
  defaultTo,
  isNonEmptyArray,
  first,
  hasProperty,
  getNested,
} from '@/utils/nullSafety';

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined([])).toBe(true);
    expect(isDefined({})).toBe(true);
    expect(isDefined('hello')).toBe(true);
    expect(isDefined(42)).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});

describe('isNil', () => {
  it('returns true for null and undefined', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
  });

  it('returns false for defined values including falsy ones', () => {
    expect(isNil(0)).toBe(false);
    expect(isNil('')).toBe(false);
    expect(isNil(false)).toBe(false);
    expect(isNil([])).toBe(false);
    expect(isNil({})).toBe(false);
  });
});

describe('defaultTo', () => {
  it('returns value when defined', () => {
    expect(defaultTo(42, 0)).toBe(42);
    expect(defaultTo('hello', 'default')).toBe('hello');
    expect(defaultTo(false, true)).toBe(false);
  });

  it('returns default when null or undefined', () => {
    expect(defaultTo(null, 'default')).toBe('default');
    expect(defaultTo(undefined, 'default')).toBe('default');
  });

  it('does not default on falsy defined values', () => {
    expect(defaultTo(0, 99)).toBe(0);
    expect(defaultTo('', 'default')).toBe('');
    expect(defaultTo(false, true)).toBe(false);
  });
});

describe('isNonEmptyArray', () => {
  it('returns true for arrays with items', () => {
    expect(isNonEmptyArray([1])).toBe(true);
    expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    expect(isNonEmptyArray(['a'])).toBe(true);
  });

  it('returns false for empty arrays', () => {
    expect(isNonEmptyArray([])).toBe(false);
  });

  it('returns false for null and undefined', () => {
    expect(isNonEmptyArray(null)).toBe(false);
    expect(isNonEmptyArray(undefined)).toBe(false);
  });
});

describe('first', () => {
  it('returns first element for non-empty arrays', () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(first(['a', 'b'])).toBe('a');
  });

  it('returns undefined for empty arrays', () => {
    expect(first([])).toBeUndefined();
  });

  it('returns undefined for null and undefined', () => {
    expect(first(null)).toBeUndefined();
    expect(first(undefined)).toBeUndefined();
  });
});

describe('hasProperty', () => {
  it('returns true for existing property', () => {
    const obj = { a: 1, b: undefined };
    expect(hasProperty(obj, 'a')).toBe(true);
  });

  it('returns false for missing property', () => {
    const obj = { a: 1 };
    expect(hasProperty(obj, 'z')).toBe(false);
  });

  it('returns true for property explicitly set to undefined', () => {
    const obj = { a: undefined };
    expect(hasProperty(obj, 'a')).toBe(true);
  });

  it('returns true for inherited properties', () => {
    const obj = {};
    expect(hasProperty(obj, 'toString')).toBe(true);
  });
});

describe('getNested', () => {
  describe('happy path', () => {
    it('accesses shallow property', () => {
      const obj = { a: 1 };
      expect(getNested<number>(obj, 'a')).toBe(1);
    });

    it('accesses deeply nested property', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(getNested<number>(obj, 'a', 'b', 'c')).toBe(42);
    });

    it('accesses very deeply nested property (5+ levels)', () => {
      const obj = { a: { b: { c: { d: { e: 'deep' } } } } };
      expect(getNested<string>(obj, 'a', 'b', 'c', 'd', 'e')).toBe('deep');
    });
  });

  describe('null and undefined roots', () => {
    it('returns undefined for null root', () => {
      expect(getNested(null, 'a')).toBeUndefined();
    });

    it('returns undefined for undefined root', () => {
      expect(getNested(undefined, 'a')).toBeUndefined();
    });
  });

  describe('null and undefined intermediates', () => {
    it('returns undefined when intermediate is null', () => {
      const obj = { a: null };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });

    it('returns undefined when intermediate is undefined', () => {
      const obj = { a: undefined };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });
  });

  describe('primitive intermediates', () => {
    it('returns undefined when intermediate is a string', () => {
      const obj = { a: 'hello' };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });

    it('returns undefined when intermediate is a number', () => {
      const obj = { a: 42 };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });

    it('returns undefined when intermediate is a boolean', () => {
      const obj = { a: true };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });

    it('returns undefined when intermediate is a symbol', () => {
      const obj = { a: Symbol('test') };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });
  });

  describe('missing keys', () => {
    it('returns undefined for missing key at shallow level', () => {
      const obj = {};
      expect(getNested(obj, 'missing')).toBeUndefined();
    });

    it('returns undefined for missing key at deep level', () => {
      const obj = { a: { b: {} } };
      expect(getNested(obj, 'a', 'b', 'missing')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns root object when no keys provided', () => {
      const obj = { a: 1 };
      expect(getNested(obj)).toEqual({ a: 1 });
    });

    it('returns undefined for null root even with no keys', () => {
      expect(getNested(null)).toBeUndefined();
    });

    it('returns undefined for undefined root even with no keys', () => {
      expect(getNested(undefined)).toBeUndefined();
    });

    it('handles array as intermediate node with valid index', () => {
      const obj = { a: [1, 2, 3] };
      expect(getNested<number>(obj, 'a', '0')).toBe(1);
      expect(getNested<number>(obj, 'a', '1')).toBe(2);
      expect(getNested<number>(obj, 'a', '2')).toBe(3);
    });

    it('returns undefined for array with out-of-bounds index', () => {
      const obj = { a: [1, 2] };
      expect(getNested(obj, 'a', '5')).toBeUndefined();
    });

    it('handles nested arrays', () => {
      const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
      expect(getNested<number>(obj, 'a', 'b', '0', 'c')).toBe(1);
      expect(getNested<number>(obj, 'a', 'b', '1', 'c')).toBe(2);
    });

    it('returns falsy-but-defined leaf values correctly', () => {
      const obj = {
        zero: 0,
        empty: '',
        flag: false,
        nullVal: null,
        undef: undefined,
      };
      expect(getNested<number>(obj, 'zero')).toBe(0);
      expect(getNested<string>(obj, 'empty')).toBe('');
      expect(getNested<boolean>(obj, 'flag')).toBe(false);
      expect(getNested(obj, 'nullVal')).toBeNull();
      expect(getNested(obj, 'undef')).toBeUndefined();
    });

    it('handles object with numeric keys', () => {
      const obj = { 0: 'first', 1: 'second' };
      expect(getNested<string>(obj, '0')).toBe('first');
      expect(getNested<string>(obj, '1')).toBe('second');
    });

    it('returns undefined when traversing into a Date object', () => {
      const obj = { a: new Date() };
      expect(getNested(obj, 'a', 'b')).toBeUndefined();
    });
  });
});
