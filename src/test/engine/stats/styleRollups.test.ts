import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('StyleRollups', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};

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
    });
  });
});
