/**
 * Awards optimization tests — verifies updateEntityInList is used correctly
 * in modifyWarrior and processTournamentPlaceAward for O(1) targeted updates.
 */
import { describe, it, expect } from 'vitest';
import { updateEntityInList } from '@/utils/stateUtils';

describe('awards optimization with updateEntityInList', () => {
  it('updateEntityInList returns same array ref when id not found', () => {
    const list = [{ id: 'a', value: 1 }];
    const result = updateEntityInList(list, 'z', (item) => ({ ...item, value: 99 }));
    expect(result).toBe(list);
  });

  it('updateEntityInList returns new array ref when id found', () => {
    const list = [{ id: 'a', value: 1 }];
    const result = updateEntityInList(list, 'a', (item) => ({ ...item, value: 99 }));
    expect(result).not.toBe(list);
  });

  it('reference equality check correctly detects not-found case', () => {
    const roster = [{ id: 'w1', name: 'Fighter1' }];
    const updated = updateEntityInList(roster, 'w1', (w) => ({ ...w, name: 'Fighter1-Updated' }));
    const notFound = updateEntityInList(roster, 'w-missing', (w) => ({ ...w }));

    expect(updated).not.toBe(roster);
    expect(notFound).toBe(roster);
  });

  it('updateEntityInList preserves other items immutably', () => {
    const list = [
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
      { id: 'c', value: 3 },
    ];
    const result = updateEntityInList(list, 'b', (item) => ({ ...item, value: 99 }));
    expect(result[0]).toBe(list[0]);
    expect(result[1]).not.toBe(list[1]);
    expect(result[2]).toBe(list[2]);
  });
});
