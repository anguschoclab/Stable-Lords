import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
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
      StyleRollups._clearCaches();
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
      StyleRollups._clearCaches();
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
      StyleRollups._clearCaches();
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

  // ── saveWeek QuotaExceededError paths (via addFight) ──

  describe('saveWeek QuotaExceededError retry failure', () => {
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
      StyleRollups._clearCaches();
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
      mockGetItem.mockReturnValue(null);
      mockSetItem.mockReset();
      mockRemoveItem.mockReset();
      mockClear.mockReset();
    });

    it('setItem throws QuotaExceededError, retry also throws → console.error called with recovery failure message', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      mockSetItem.mockImplementation(() => {
        throw quotaError;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 15,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      // Should have called console.error for the recovery failure
      const recoveryCall = consoleSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Failed to recover from localStorage quota error for week 15')
      );
      expect(recoveryCall).toBeDefined();
      consoleSpy.mockRestore();
    });

    it('setItem throws QuotaExceededError, retry also throws → removeItem called for weeks week-10 down to 1', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      mockSetItem.mockImplementation(() => {
        throw quotaError;
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 15,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      // week 15 - 10 = 5, so removeItem should be called for weeks 5,4,3,2,1
      // Note: addFight also calls saveRolling which calls setItem (also throws QuotaExceededError)
      // The week saveWeek removeItem calls are for keys sl.styleRollups.week_${i}
      const weekKeys = mockRemoveItem.mock.calls
        .map((c) => c[0] as string)
        .filter((k) => k.startsWith('sl.styleRollups.week_'));
      // Weeks 5 down to 1
      expect(weekKeys).toContain('sl.styleRollups.week_5');
      expect(weekKeys).toContain('sl.styleRollups.week_1');
      expect(weekKeys.length).toBe(5);

      vi.restoreAllMocks();
    });

    it('setItem throws QuotaExceededError, retry succeeds → data persisted to localStorage', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      let firstCall = true;
      mockSetItem.mockImplementation((key: string) => {
        if (key.startsWith('sl.styleRollups.week_') && firstCall) {
          firstCall = false;
          throw quotaError;
        }
        // Succeed on retry and for other setItem calls (saveRolling, etc.)
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 15,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      // The retry setItem should have been called for the week key
      const weekSetCalls = mockSetItem.mock.calls.filter(
        (c) => (c[0] as string).startsWith('sl.styleRollups.week_15')
      );
      // First call throws, retry succeeds → at least 2 calls for week_15
      expect(weekSetCalls.length).toBeGreaterThanOrEqual(2);

      vi.restoreAllMocks();
    });

    it('setItem throws QuotaExceededError, retry succeeds → removeItem called for older weeks', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      let firstCall = true;
      mockSetItem.mockImplementation((key: string) => {
        if (key.startsWith('sl.styleRollups.week_') && firstCall) {
          firstCall = false;
          throw quotaError;
        }
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 15,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      const weekKeys = mockRemoveItem.mock.calls
        .map((c) => c[0] as string)
        .filter((k) => k.startsWith('sl.styleRollups.week_'));
      // Weeks 5 down to 1 should be removed
      expect(weekKeys).toContain('sl.styleRollups.week_5');
      expect(weekKeys).toContain('sl.styleRollups.week_1');

      vi.restoreAllMocks();
    });
  });

  describe('saveWeek non-quota error', () => {
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
      StyleRollups._clearCaches();
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
      mockGetItem.mockReturnValue(null);
      mockSetItem.mockReset();
      mockRemoveItem.mockReset();
      mockClear.mockReset();
    });

    it('setItem throws non-QuotaExceededError → console.error called with generic message, no removeItem for week keys', () => {
      const genericError = new Error('something went wrong');
      mockSetItem.mockImplementation(() => {
        throw genericError;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 10,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      // Should have called console.error with generic "Failed to save week" message
      const genericCall = consoleSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('Failed to save week 10 style rollups')
      );
      expect(genericCall).toBeDefined();

      // removeItem should NOT be called for week keys (no recovery attempt)
      const weekKeys = mockRemoveItem.mock.calls
        .map((c) => c[0] as string)
        .filter((k) => k.startsWith('sl.styleRollups.week_'));
      expect(weekKeys.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('saveWeek cache behavior', () => {
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
      StyleRollups._clearCaches();
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
      mockGetItem.mockReturnValue(null);
      mockSetItem.mockReset();
      mockRemoveItem.mockReset();
      mockClear.mockReset();
    });

    it('weekCache is set even when localStorage throws', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      mockSetItem.mockImplementation(() => {
        throw quotaError;
      });

      vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 3,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      // getWeekRollup should return cached data even though setItem failed
      const rollup = StyleRollups.getWeekRollup(3);
      expect(rollup).toBeDefined();
      expect(rollup.Sword).toBeDefined();
      expect(rollup.Sword!.w).toBe(1);

      vi.restoreAllMocks();
    });
  });

  describe('saveRolling QuotaExceededError', () => {
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
      StyleRollups._clearCaches();
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
      mockGetItem.mockReturnValue(null);
      mockSetItem.mockReset();
      mockRemoveItem.mockReset();
      mockClear.mockReset();
    });

    it('saveRolling QuotaExceededError → console.error called, no retry attempted', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      // Only the rolling key setItem throws; week key succeeds
      mockSetItem.mockImplementation((key: string) => {
        if (key === 'sl.metrics.style.week10') {
          throw quotaError;
        }
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 5,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
      });

      // Should log the rolling quota error
      const rollingCall = consoleSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('localStorage quota exceeded when saving rolling style metrics')
      );
      expect(rollingCall).toBeDefined();

      // No removeItem calls for rolling (no retry)
      const rollingRemoveKeys = mockRemoveItem.mock.calls
        .map((c) => c[0] as string)
        .filter((k) => k.includes('rolling') || k.includes('week10'));
      expect(rollingRemoveKeys.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('saveTour QuotaExceededError', () => {
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
      StyleRollups._clearCaches();
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
      mockGetItem.mockReturnValue(null);
      mockSetItem.mockReset();
      mockRemoveItem.mockReset();
      mockClear.mockReset();
    });

    it('saveTour QuotaExceededError → console.error called, no retry attempted', () => {
      const quotaError = new Error('quota');
      (quotaError as Error).name = 'QuotaExceededError';
      // Only the tour key setItem throws
      mockSetItem.mockImplementation((key: string) => {
        if (key === 'sl.metrics.style.tournaments') {
          throw quotaError;
        }
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({
        week: 5,
        styleA: 'Sword',
        styleD: 'Axe',
        winner: 'A',
        by: null,
        isTournament: 'tour-1',
      });

      // Should log the tour quota error
      const tourCall = consoleSpy.mock.calls.find(
        (call) =>
          typeof call[0] === 'string' &&
          call[0].includes('localStorage quota exceeded when saving tournament style metrics')
      );
      expect(tourCall).toBeDefined();

      // No removeItem calls for tour (no retry)
      const tourRemoveKeys = mockRemoveItem.mock.calls
        .map((c) => c[0] as string)
        .filter((k) => k.includes('tournament') || k.includes('tour'));
      expect(tourRemoveKeys.length).toBe(0);

      consoleSpy.mockRestore();
    });
  });
});
