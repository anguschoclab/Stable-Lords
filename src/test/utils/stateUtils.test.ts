import { describe, it, expect } from 'vitest';
import { updateEntityInList, truncateArray } from '@/utils/stateUtils';

describe('stateUtils', () => {
  describe('updateEntityInList', () => {
    it('updates the matching item immutably', () => {
      const list = [
        { id: 'a', value: 1 },
        { id: 'b', value: 2 },
        { id: 'c', value: 3 },
      ];
      const result = updateEntityInList(list, 'b', (item) => ({ ...item, value: 99 }));
      expect(result).toEqual([
        { id: 'a', value: 1 },
        { id: 'b', value: 99 },
        { id: 'c', value: 3 },
      ]);
      expect(result).not.toBe(list); // new array
      expect(result[1]).not.toBe(list[1]); // new object
    });

    it('returns original array when id is not found', () => {
      const list = [{ id: 'a', value: 1 }];
      const result = updateEntityInList(list, 'z', (item) => ({ ...item, value: 99 }));
      expect(result).toBe(list);
    });

    it('handles empty arrays gracefully', () => {
      const list: { id: string; value: number }[] = [];
      const result = updateEntityInList(list, 'a', (item) => ({ ...item, value: 99 }));
      expect(result).toBe(list);
    });
  });

  describe('truncateArray', () => {
    it('returns original array when within limit', () => {
      const arr = [1, 2, 3];
      expect(truncateArray(arr, 5)).toBe(arr);
    });

    it('truncates to last N items when over limit', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(truncateArray(arr, 3)).toEqual([3, 4, 5]);
    });

    it('returns empty array when limit is 0', () => {
      const arr = [1, 2, 3];
      expect(truncateArray(arr, 0)).toEqual([]);
    });
  });
});
