import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
      length: 0
    };

    globalThis.localStorage = mockStorage as any;
  });

  afterEach(() => {
    // Reset spy/mocks
    vi.restoreAllMocks();
  });

  describe('addFight', () => {
    it('should properly record a basic win/loss without kill', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Striker',
        styleD: 'Grappler',
        winner: 'A',
        by: 'Decision'
      });

      const wk = StyleRollups.getWeekRollup(1);
      expect(wk['Striker']).toEqual({ w: 1, l: 0, k: 0, pct: 1, fights: 1 });
      expect(wk['Grappler']).toEqual({ w: 0, l: 1, k: 0, pct: 0, fights: 1 });

      const last10 = StyleRollups.last10();
      expect(last10.find(s => s.style === 'Striker')).toMatchObject({ W: 1, L: 0, K: 0, P: 100, fights: 1 });
      expect(last10.find(s => s.style === 'Grappler')).toMatchObject({ W: 0, L: 1, K: 0, P: 0, fights: 1 });
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
    it('should properly record a win with kill', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Striker',
        styleD: 'Grappler',
        winner: 'D',
        by: 'Kill'
      });

      const wk = StyleRollups.getWeekRollup(1);
      expect(wk['Grappler']).toEqual({ w: 1, l: 0, k: 1, pct: 1, fights: 1 });
      expect(wk['Striker']).toEqual({ w: 0, l: 1, k: 0, pct: 0, fights: 1 });

      const last10 = StyleRollups.last10();
      expect(last10.find(s => s.style === 'Grappler')).toMatchObject({ W: 1, L: 0, K: 1, P: 100, fights: 1 });
    });

    it('should properly record a draw', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Striker',
        styleD: 'Grappler',
        winner: null,
        by: 'Draw'
      });

      const wk = StyleRollups.getWeekRollup(1);
      expect(wk['Striker']).toEqual({ w: 0, l: 0, k: 0, pct: 0, fights: 1 });
      expect(wk['Grappler']).toEqual({ w: 0, l: 0, k: 0, pct: 0, fights: 1 });

      const last10 = StyleRollups.last10();
      expect(last10.find(s => s.style === 'Striker')).toMatchObject({ W: 0, L: 1, K: 0, P: 0, fights: 1 }); // Rolling logic treats null as loss for both
    });

    it('should aggregate rolling windows correctly up to 10 fights', () => {
      // Add 12 fights
      for(let i = 0; i < 12; i++) {
        StyleRollups.addFight({
          week: 1,
          styleA: 'Striker',
          styleD: 'Grappler',
          winner: 'A',
          by: 'Decision'
        });
      }

      const last10 = StyleRollups.last10();
      const striker = last10.find(s => s.style === 'Striker');

      expect(striker?.fights).toBe(10);
      expect(striker?.W).toBe(10);
      expect(striker?.P).toBe(100);
    });

    it('should track tournaments properly when isTournament is provided', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Striker',
        styleD: 'Grappler',
        winner: 'A',
        by: 'Decision',
        isTournament: 'tour1'
      });

      const tourStats = StyleRollups.tournament('tour1');
      expect(tourStats.length).toBe(2);
      expect(tourStats.find(s => s.style === 'Striker')).toMatchObject({ W: 1, L: 0, K: 0, P: 100, fights: 1 });

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
    // Polyfill localStorage logic since we cannot use stubGlobal properly in this sandbox env
    const originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
      },
      writable: true,
      configurable: true
    });
  });

  describe('addFight', () => {
    it('records a basic win without kill', () => {
      StyleRollups.addFight({
        week: 1,
        styleA: 'Aggressive',
        styleD: 'Defensive',
        winner: 'A',
        by: 'Decision',
      });

      const week1 = StyleRollups.getWeekRollup(1);
      expect(week1['Aggressive']).toEqual({ w: 1, l: 0, k: 0, pct: 1, fights: 1 });
      expect(week1['Defensive']).toEqual({ w: 0, l: 1, k: 0, pct: 0, fights: 1 });

      const last10 = StyleRollups.last10();
      const agg = last10.find((s) => s.style === 'Aggressive');
      expect(agg).toEqual({ style: 'Aggressive', W: 1, L: 0, K: 0, P: 100, fights: 1 });
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
    it('records a win with kill', () => {
      StyleRollups.addFight({
        week: 2,
        styleA: 'Aggressive',
        styleD: 'Defensive',
        winner: 'D',
        by: 'Kill',
      });

      const week2 = StyleRollups.getWeekRollup(2);
      expect(week2['Defensive']).toEqual({ w: 1, l: 0, k: 1, pct: 1, fights: 1 });
      expect(week2['Aggressive']).toEqual({ w: 0, l: 1, k: 0, pct: 0, fights: 1 });

      const last10 = StyleRollups.last10();
      const def = last10.find((s) => s.style === 'Defensive');
      expect(def?.K).toBe(1);
    });

    it('records a tournament fight', () => {
      StyleRollups.addFight({
        week: 3,
        styleA: 'Tactical',
        styleD: 'Aggressive',
        winner: 'A',
        by: 'Submission',
        isTournament: 'tourney-1',
      });

      const tourneyStats = StyleRollups.tournament('tourney-1');
      const tactical = tourneyStats.find((s) => s.style === 'Tactical');
      expect(tactical).toEqual({ style: 'Tactical', W: 1, L: 0, K: 0, P: 100, fights: 1 });
    });

    it('caps rolling window at 10 fights', () => {
      for (let i = 0; i < 15; i++) {
        StyleRollups.addFight({
          week: 4,
          styleA: 'SpamStyle',
          styleD: 'DummyStyle',
          winner: 'A',
          by: 'Decision',
        });
      }

      const last10 = StyleRollups.last10();
      const spam = last10.find((s) => s.style === 'SpamStyle');
      // Should cap at 10 fights in the rolling window
      expect(spam?.fights).toBe(10);
      expect(spam?.W).toBe(10);

      // But the week should have 15
      const week4 = StyleRollups.getWeekRollup(4);
      expect(week4['SpamStyle'].fights).toBe(15);
    });

    it('handles null winner (draw/cancelled)', () => {
      StyleRollups.addFight({
        week: 5,
        styleA: 'Aggressive',
        styleD: 'Defensive',
        winner: null,
        by: null,
      });

      const week5 = StyleRollups.getWeekRollup(5);
      expect(week5['Aggressive']).toEqual({ w: 0, l: 0, k: 0, pct: 0, fights: 1 });
    });
  });

  describe('Storage Error Handling & Validation', () => {
    it('handles JSON parsing errors gracefully', () => {
      localStorageMock['sl.styleRollups.week_1'] = 'invalid-json';
      localStorageMock['sl.metrics.style.week10'] = 'invalid-json';
      localStorageMock['sl.metrics.style.tournaments'] = 'invalid-json';

      expect(StyleRollups.getWeekRollup(1)).toEqual({});
      expect(StyleRollups.last10()).toEqual([]);
      expect(StyleRollups.tournament('some-tid')).toEqual([]);
    });

    it('handles invalid data structures during validation', () => {
      localStorageMock['sl.styleRollups.week_1'] = JSON.stringify({
        ValidStyle: { w: 1, l: 0, k: 0, pct: 1, fights: 1 },
        InvalidStyle: { w: 'string', missingData: true },
      });

      const week1 = StyleRollups.getWeekRollup(1);
      expect(week1['ValidStyle']).toBeDefined();
      expect(week1['InvalidStyle']).toBeUndefined();
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
    it('handles missing local storage', () => {
      // Simulate environment without localStorage
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Should not throw and just return empty data
      expect(StyleRollups.getWeekRollup(1)).toEqual({});

      // Should not throw on save
      expect(() => {
        StyleRollups.addFight({
          week: 1,
          styleA: 'A',
          styleD: 'D',
          winner: 'A',
          by: null
        });
      }).not.toThrow();
    });

    it('attempts to recover from QuotaExceededError when saving a week', () => {
      let isFirstSetItem = true;
      const setItemSpy = vi.fn((key: string, value: string) => {
        if (key === 'sl.styleRollups.week_15' && isFirstSetItem) {
          isFirstSetItem = false;
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        localStorageMock[key] = value;
      });

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => localStorageMock[key] || null),
          setItem: setItemSpy,
          removeItem: vi.fn((key: string) => {
            delete localStorageMock[key];
          }),
        },
        writable: true,
        configurable: true
      });

      // Fill mock with older weeks
      for (let i = 5; i < 15; i++) {
        localStorageMock[`sl.styleRollups.week_${i}`] = JSON.stringify({});
      }

      StyleRollups.addFight({
        week: 15,
        styleA: 'Aggressive',
        styleD: 'Defensive',
        winner: 'A',
        by: 'Decision',
      });

      // Should have triggered a removal of older weeks
      expect(localStorageMock['sl.styleRollups.week_5']).toBeUndefined();
      expect(localStorageMock['sl.styleRollups.week_15']).toBeDefined();
    });

    it('handles QuotaExceededError without throwing for rolling and tournament data', () => {
      const setItemSpy = vi.fn((key: string, value: string) => {
        if (key.includes('metrics')) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
        localStorageMock[key] = value;
      });

      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => localStorageMock[key] || null),
          setItem: setItemSpy,
        },
        writable: true,
        configurable: true
      });

      // Should not throw exception, just console.error
      expect(() => {
        StyleRollups.addFight({
          week: 1,
          styleA: 'Aggressive',
          styleD: 'Defensive',
          winner: 'A',
          by: 'Decision',
          isTournament: 'tourney-1',
        });
      }).not.toThrow();
    });

    it('ignores empty rolling stats or invalid properties safely', () => {
      // Intentionally break the rolling JSON to have mixed state
      localStorageMock['sl.metrics.style.week10'] = JSON.stringify({
        ValidStats: [{ W: 1, L: 0, K: 0, fights: 1 }],
        InvalidStats: [{ badData: true }],
      });

      const last10 = StyleRollups.last10();
      expect(last10.find((s) => s.style === 'ValidStats')).toBeDefined();
      expect(last10.find((s) => s.style === 'InvalidStats')).toBeUndefined();
    });

    it('ignores empty tour stats or invalid properties safely', () => {
      // Intentionally break the tour JSON to have mixed state
      localStorageMock['sl.metrics.style.tournaments'] = JSON.stringify({
        'tour-1': {
          ValidStats: { W: 1, L: 0, K: 0, fights: 1 },
          InvalidStats: { badData: true },
        }
      });

      const tour = StyleRollups.tournament('tour-1');
      expect(tour.find((s) => s.style === 'ValidStats')).toBeDefined();
      expect(tour.find((s) => s.style === 'InvalidStats')).toBeUndefined();
      const emptyTourStats = StyleRollups.tournament('nonexistent');
      expect(emptyTourStats.length).toBe(0);
    });
  });

  describe('Validation & Storage Edge Cases', () => {
    it('should handle corrupt week data gracefully', () => {
      localStorageMock[`sl.styleRollups.week_1`] = 'invalid json';
      expect(StyleRollups.getWeekRollup(1)).toEqual({});

      localStorageMock[`sl.styleRollups.week_1`] = JSON.stringify({ Striker: "not a bucket" });
      expect(StyleRollups.getWeekRollup(1)).toEqual({});

      localStorageMock[`sl.styleRollups.week_1`] = JSON.stringify("string array");
      expect(StyleRollups.getWeekRollup(1)).toEqual({});
    });

    it('should handle corrupt rolling data gracefully', () => {
      localStorageMock[`sl.metrics.style.week10`] = 'invalid json';
      expect(StyleRollups.last10()).toEqual([]);

      localStorageMock[`sl.metrics.style.week10`] = JSON.stringify({ Striker: ["not a rolling bucket"] });
      expect(StyleRollups.last10()).toEqual([]);

      localStorageMock[`sl.metrics.style.week10`] = JSON.stringify("string");
      expect(StyleRollups.last10()).toEqual([]);
    });

    it('should handle corrupt tournament data gracefully', () => {
      localStorageMock[`sl.metrics.style.tournaments`] = 'invalid json';
      expect(StyleRollups.tournament('tour1')).toEqual([]);

      localStorageMock[`sl.metrics.style.tournaments`] = JSON.stringify({ tour1: "not a week record" });
      expect(StyleRollups.tournament('tour1')).toEqual([]);

      localStorageMock[`sl.metrics.style.tournaments`] = JSON.stringify({ tour1: { Striker: "not a rolling bucket" }});
      expect(StyleRollups.tournament('tour1')).toEqual([]);
    });

    it('should handle localStorage being undefined safely', () => {
      const originalLocalStorage = globalThis.localStorage;
      // @ts-ignore
      delete globalThis.localStorage;

      expect(StyleRollups.getWeekRollup(1)).toEqual({});
      expect(StyleRollups.last10()).toEqual([]);
      expect(StyleRollups.tournament('tour1')).toEqual([]);

      // Should not throw
      StyleRollups.addFight({
        week: 1,
        styleA: 'A',
        styleD: 'B',
        winner: 'A',
        by: 'D',
        isTournament: 'T'
      });

      globalThis.localStorage = originalLocalStorage;
    });

    it('should handle QuotaExceededError and perform cleanup for saveWeek', () => {
      let callCount = 0;
      const mockStorage = {
        setItem: vi.fn((key: string, val: string) => {
          if (key.startsWith('sl.styleRollups.week_')) {
            callCount++;
            if (callCount === 1) { // Only fail the first time
              const err = new Error('Quota exceeded');
              err.name = 'QuotaExceededError';
              throw err;
            }
          }
        }),
        removeItem: vi.fn(),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;

      vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D' });

      expect(mockStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(mockStorage.removeItem).toHaveBeenCalledWith('sl.styleRollups.week_1');
      // Verify it tried to save again
      expect(mockStorage.setItem).toHaveBeenCalledTimes(3); // 2 times for week_10 (1st fail, 2nd success), 1 for rolling, 1 for maybe other stuff
    });

    it('should handle unrecoverable QuotaExceededError in saveWeek', () => {
      const mockStorage = {
        setItem: vi.fn((key: string) => {
          if (key.startsWith('sl.styleRollups.week_')) {
            const err = new Error('Quota exceeded');
            err.name = 'QuotaExceededError';
            throw err;
          }
        }),
        removeItem: vi.fn(() => {
          throw new Error('Remove failed');
        }),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to recover from localStorage quota error for week 11',
        expect.any(Error)
      );
    });

    it('should handle other errors in saveWeek', () => {
      const mockStorage = {
        setItem: vi.fn((key: string) => {
          if (key.startsWith('sl.styleRollups.week_')) {
            throw new Error('Some other error');
          }
        }),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save week 11 style rollups',
        expect.any(Error)
      );
    });

    it('should handle QuotaExceededError in saveRolling', () => {
      const mockStorage = {
        setItem: vi.fn((key: string) => {
          if (key === 'sl.metrics.style.week10') {
            const err = new Error('Quota exceeded');
            err.name = 'QuotaExceededError';
            throw err;
          }
        }),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'localStorage quota exceeded when saving rolling style metrics',
        expect.any(Error)
      );
    });

    it('should handle other errors in saveRolling', () => {
      const mockStorage = {
        setItem: vi.fn((key: string) => {
          if (key === 'sl.metrics.style.week10') {
            throw new Error('Some other error');
          }
        }),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save rolling style metrics',
        expect.any(Error)
      );
    });

    it('should handle QuotaExceededError in saveTour', () => {
      const mockStorage = {
        setItem: vi.fn((key: string) => {
          if (key === 'sl.metrics.style.tournaments') {
            const err = new Error('Quota exceeded');
            err.name = 'QuotaExceededError';
            throw err;
          }
        }),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D', isTournament: 'T' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'localStorage quota exceeded when saving tournament style metrics',
        expect.any(Error)
      );
    });

    it('should handle other errors in saveTour', () => {
      const mockStorage = {
        setItem: vi.fn((key: string) => {
          if (key === 'sl.metrics.style.tournaments') {
            throw new Error('Some other error');
          }
        }),
        getItem: vi.fn(() => null)
      };
      globalThis.localStorage = mockStorage as any;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      StyleRollups.addFight({ week: 11, styleA: 'A', styleD: 'B', winner: 'A', by: 'D', isTournament: 'T' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save tournament style metrics',
        expect.any(Error)
      );
    });
  });
});
