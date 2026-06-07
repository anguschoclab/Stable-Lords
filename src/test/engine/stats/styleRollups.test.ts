import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
  describe('loadWeek (via getWeekRollup)', () => {
    const mockGetItem = vi.fn();
    const mockSetItem = vi.fn();
    const mockRemoveItem = vi.fn();
    const mockClear = vi.fn();
    let originalLS: Storage;

    beforeAll(() => {
      originalLS = globalThis.localStorage;
    });

    afterAll(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLS,
        configurable: true,
        writable: true,
      });
    });

    beforeEach(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: mockGetItem,
          setItem: mockSetItem,
          removeItem: mockRemoveItem,
          clear: mockClear,
        },
        configurable: true,
        writable: true,
      });
      mockClear.mockClear();
      mockGetItem.mockClear();
      mockSetItem.mockClear();
      mockRemoveItem.mockClear();
    });

    it('returns {} if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem returns null', () => {
      mockGetItem.mockReturnValue(null);
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem returns an invalid JSON string (loadWeek error path)', () => {
      mockGetItem.mockReturnValue('{invalid}');
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem returns invalid JSON', () => {
      mockGetItem.mockReturnValue('{ invalid json');
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns {} if localStorage.getItem throws an Error', () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({});
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        Sword: { w: 1, l: 0, k: 0, pct: 1, fights: 1 },
      };
      mockGetItem.mockReturnValue(JSON.stringify(validData));
      expect(StyleRollups.getWeekRollup(1)).toEqual(validData);
    });

    it('filters out invalid records', () => {
      const mixedData = {
        Sword: { w: 1, l: 0, k: 0, pct: 1, fights: 1 },
        Axe: { invalid: 'data' }, // Should be ignored by validateWeekRecord
        Spear: 'string', // Should be ignored
      };
      mockGetItem.mockReturnValue(JSON.stringify(mixedData));
      expect(StyleRollups.getWeekRollup(1)).toMatchObject({
        Sword: { w: 1, l: 0, k: 0, pct: 1, fights: 1 },
      });
    });
  });

  describe('loadRolling (via last10)', () => {
    const mockGetItem2 = vi.fn();
    const mockSetItem2 = vi.fn();
    const mockRemoveItem2 = vi.fn();
    const mockClear2 = vi.fn();
    let originalLS2: Storage;

    beforeAll(() => {
      originalLS2 = globalThis.localStorage;
    });

    afterAll(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLS2,
        configurable: true,
        writable: true,
      });
    });

    beforeEach(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: mockGetItem2,
          setItem: mockSetItem2,
          removeItem: mockRemoveItem2,
          clear: mockClear2,
        },
        configurable: true,
        writable: true,
      });
      mockClear2.mockClear();
      mockGetItem2.mockClear();
      mockSetItem2.mockClear();
      mockRemoveItem2.mockClear();
    });

    it('returns [] if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns null', () => {
      mockGetItem2.mockReturnValue(null);
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns invalid JSON', () => {
      mockGetItem2.mockReturnValue('{ invalid json');
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns [] if localStorage.getItem throws an Error', () => {
      mockGetItem2.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        Sword: [
          { W: 1, L: 0, K: 0, fights: 1 },
          { W: 0, L: 1, K: 0, fights: 1 },
        ],
      };
      mockGetItem2.mockReturnValue(JSON.stringify(validData));
      const result = StyleRollups.last10();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        style: 'Sword',
        W: 1,
        L: 1,
        K: 0,
        fights: 2,
        P: 50,
      });
    });

    it('filters out invalid records', () => {
      const mixedData = {
        Sword: [{ W: 1, L: 0, K: 0, fights: 1 }, { invalid: 'data' }],
        Axe: { notAnArray: true },
        Spear: 'string',
      };
      mockGetItem2.mockReturnValue(JSON.stringify(mixedData));
      const result = StyleRollups.last10();
      expect(result).toHaveLength(1);
      expect(result[0]!.style).toBe('Sword');
      expect(result[0]!.fights).toBe(1);
    });
  });

  describe('loadTour (via tournament)', () => {
    const mockGetItem3 = vi.fn();
    const mockSetItem3 = vi.fn();
    const mockRemoveItem3 = vi.fn();
    const mockClear3 = vi.fn();
    let originalLS3: Storage;

    beforeAll(() => {
      originalLS3 = globalThis.localStorage;
    });

    afterAll(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLS3,
        configurable: true,
        writable: true,
      });
    });

    beforeEach(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: mockGetItem3,
          setItem: mockSetItem3,
          removeItem: mockRemoveItem3,
          clear: mockClear3,
        },
        configurable: true,
        writable: true,
      });
      mockClear3.mockClear();
      mockGetItem3.mockClear();
      mockSetItem3.mockClear();
      mockRemoveItem3.mockClear();
    });

    it('returns [] if localStorage is undefined', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns null', () => {
      mockGetItem3.mockReturnValue(null);
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns [] if localStorage.getItem returns invalid JSON', () => {
      mockGetItem3.mockReturnValue('{ invalid json');
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns [] if localStorage.getItem throws an Error', () => {
      mockGetItem3.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('returns valid records if localStorage has valid data', () => {
      const validData = {
        tour1: {
          Sword: { W: 1, L: 0, K: 0, fights: 1 },
        },
      };
      mockGetItem3.mockReturnValue(JSON.stringify(validData));
      const result = StyleRollups.tournament('tour1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        style: 'Sword',
        W: 1,
        L: 0,
        K: 0,
        fights: 1,
        P: 100,
      });
    });

    it('filters out invalid records', () => {
      const mixedData = {
        tour1: {
          Sword: { W: 1, L: 0, K: 0, fights: 1 },
          Axe: { invalid: 'data' },
        },
        tour2: {
          Spear: { W: 0, L: 1, K: 0, fights: 1 },
        },
      };
      mockGetItem3.mockReturnValue(JSON.stringify(mixedData));
      const result = StyleRollups.tournament('tour1');
      expect(result).toHaveLength(1);
      expect(result[0]!.style).toBe('Sword');
    });
  });
});
