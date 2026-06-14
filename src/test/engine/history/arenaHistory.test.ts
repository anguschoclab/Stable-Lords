import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import { FightingStyle, type FightSummary } from '@/types/game';
import '@/test/_setup/setup';

describe('ArenaHistory persistence error handling', () => {
  const createMockFight = (overrides: Partial<FightSummary>): FightSummary => ({
    id: 'mock-id' as any,
    title: 'Mock Fight',
    warriorIdA: 'attacker-id' as any,
    warriorIdD: 'defender-id' as any,
    stableIdA: 'stable-a' as any,
    stableIdD: 'stable-d' as any,
    winner: 'A',
    by: 'KO',
    styleA: FightingStyle.StrikingAttack,
    styleD: FightingStyle.ParryRiposte,
    week: 1,
    createdAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    (localStorage as any)._resetQuota?.();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('QuotaExceededError handling', () => {
    it('handles QuotaExceededError gracefully (no throw)', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        (err as any).name = 'QuotaExceededError';
        throw err;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fight = createMockFight({ id: 'f1' as any });
      expect(() => ArenaHistory.append(fight)).not.toThrow();

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('attempts trim-to-100 retry on quota error when existing > 100', () => {
      // Pre-populate localStorage with 150 fights directly
      const fights = Array.from({ length: 150 }, (_, i) => createMockFight({ id: `f${i}` as any }));
      localStorage.setItem('sl.arenaHistory', JSON.stringify(fights));

      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        (err as any).name = 'QuotaExceededError';
        throw err;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fight = createMockFight({ id: 'f151' as any });
      ArenaHistory.append(fight);

      // Should have logged quota error
      expect(consoleSpy).toHaveBeenCalledWith(
        'localStorage quota exceeded when saving arena history',
        expect.any(Error)
      );

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('skips retry when existing <= 100 (edge case)', () => {
      // Pre-populate with 50 fights
      const fights = Array.from({ length: 50 }, (_, i) => createMockFight({ id: `f${i}` as any }));
      localStorage.setItem('sl.arenaHistory', JSON.stringify(fights));

      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        (err as any).name = 'QuotaExceededError';
        throw err;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fight = createMockFight({ id: 'f51' as any });
      ArenaHistory.append(fight);

      // Should have logged quota error
      expect(consoleSpy).toHaveBeenCalledWith(
        'localStorage quota exceeded when saving arena history',
        expect.any(Error)
      );

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('logs error when retry fails', () => {
      // Pre-populate with 150 fights
      const fights = Array.from({ length: 150 }, (_, i) => createMockFight({ id: `f${i}` as any }));
      localStorage.setItem('sl.arenaHistory', JSON.stringify(fights));

      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        const err = new Error('QuotaExceededError');
        (err as any).name = 'QuotaExceededError';
        throw err;
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fight = createMockFight({ id: 'f151' as any });
      ArenaHistory.append(fight);

      // Should log both the initial error and the retry error
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenNthCalledWith(
        1,
        'localStorage quota exceeded when saving arena history',
        expect.any(Error)
      );
      expect(consoleSpy).toHaveBeenNthCalledWith(
        2,
        'Failed to recover from localStorage quota error for arena history',
        expect.any(Error)
      );

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('Non-quota error handling', () => {
    it('handles non-quota errors gracefully', () => {
      const setItemSpy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Some other error');
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fight = createMockFight({ id: 'f1' as any });
      expect(() => ArenaHistory.append(fight)).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to save arena history', expect.any(Error));

      setItemSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('load() error handling', () => {
    it('returns empty array when localStorage is undefined', () => {
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      const result = ArenaHistory.all();
      expect(result).toEqual([]);
      // Restore localStorage for other tests
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        configurable: true,
        writable: true,
      });
    });

    it('returns empty array on JSON parse error', () => {
      localStorage.setItem('sl.arenaHistory', 'invalid json');
      const result = ArenaHistory.all();
      expect(result).toEqual([]);
    });
  });
});
