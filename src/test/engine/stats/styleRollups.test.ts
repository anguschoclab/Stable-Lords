import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
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
