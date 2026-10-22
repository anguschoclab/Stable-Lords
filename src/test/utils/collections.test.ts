import { describe, it, expect } from 'vitest';
import { indexBy, groupBy, keySet } from '@/utils/collections';

describe('indexBy', () => {
  it('maps each item to its key in one pass', () => {
    const items = [
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ];
    const map = indexBy(items, (i) => i.id);
    expect(map.get('a')).toBe(items[0]);
    expect(map.get('b')).toBe(items[1]);
    expect(map.size).toBe(2);
  });

  it('keeps the FIRST item on key collision — drop-in for Array.find semantics', () => {
    const items = [
      { id: 'x', tag: 'first' },
      { id: 'x', tag: 'second' },
    ];
    expect(indexBy(items, (i) => i.id).get('x')?.tag).toBe('first');
  });

  it('returns an empty map for empty/undefined input', () => {
    expect(indexBy([], (i: { id: string }) => i.id).size).toBe(0);
    expect(indexBy(undefined, (i: { id: string }) => i.id).size).toBe(0);
  });

  it('supports non-string keys', () => {
    const map = indexBy([{ n: 1 }, { n: 2 }], (i) => i.n);
    expect(map.get(2)).toEqual({ n: 2 });
  });
});

describe('groupBy', () => {
  it('buckets items under their key preserving insertion order', () => {
    const items = [
      { k: 'a', v: 1 },
      { k: 'b', v: 2 },
      { k: 'a', v: 3 },
    ];
    const groups = groupBy(items, (i) => i.k);
    expect(groups.get('a')).toEqual([items[0], items[2]]);
    expect(groups.get('b')).toEqual([items[1]]);
  });

  it('returns an empty map for empty/undefined input', () => {
    expect(groupBy([], (i: { k: string }) => i.k).size).toBe(0);
    expect(groupBy(undefined, (i: { k: string }) => i.k).size).toBe(0);
  });
});

describe('keySet', () => {
  it('builds a membership set of extracted keys', () => {
    const set = keySet([{ id: 'a' }, { id: 'b' }], (i) => i.id);
    expect(set.has('a')).toBe(true);
    expect(set.has('c')).toBe(false);
  });

  it('returns an empty set for empty/undefined input', () => {
    expect(keySet([], (i: { id: string }) => i.id).size).toBe(0);
    expect(keySet(undefined, (i: { id: string }) => i.id).size).toBe(0);
  });
});
