import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import { handleLocalStorageQuotaError } from '@/utils/storage';
import '@/test/_setup/setup';

// Mock localStorage since we are running in Node
let store: Record<string, string> = {};

const localStorageMock = (() => {
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      // Avoid dynamic delete for linting by rebuilding the object without the key
      const newStore: Record<string, string> = {};
      for (const k in store) {
        if (k !== key) {
          newStore[k] = store[k]!;
        }
      }
      store = newStore;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const originalLocalStorage = global.localStorage;

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('handleLocalStorageQuotaError', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset setItem to default implementation to prevent quota error leak
    (localStorage.setItem as any).mockImplementation((key: string, value: string) => {
      store[key] = value.toString();
    });
  });

  afterAll(() => {
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('saves data successfully when quota is available', () => {
    const data = { key: 'value' };
    handleLocalStorageQuotaError('test-key', data);
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(data));
  });

  it('trims array data when quota is exceeded on the first attempt, then succeeds', () => {
    // Mock the first call to throw a quota error, and the second to succeed
    let calls = 0;

    (localStorage.setItem as any).mockImplementation((_key: string, _value: string) => {
      calls++;
      if (calls === 1) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      // On second call, let it pass
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Provide an array of 10 items
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Should trim the first 20% (2 items: 1, 2) and save [3, 4, 5, 6, 7, 8, 9, 10]
    handleLocalStorageQuotaError('test-array-key', data);

    expect(localStorage.setItem).toHaveBeenCalledTimes(2);
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      'test-array-key',
      JSON.stringify([3, 4, 5, 6, 7, 8, 9, 10])
    );

    consoleSpy.mockRestore();
  });

  it('throws an error if data is an object and quota is exceeded', () => {
    (localStorage.setItem as any).mockImplementation(() => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const data = { key: 'value' };

    expect(() => {
      handleLocalStorageQuotaError('test-object-key', data);
    }).toThrow('Unable to save test-object-key to localStorage due to quota limits');

    consoleSpy.mockRestore();
  });

  it('handles empty array with quota error', () => {
    (localStorage.setItem as any).mockImplementation(() => {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const data: any[] = [];

    expect(() => {
      handleLocalStorageQuotaError('test-empty-array-key', data);
    }).toThrow('Unable to save test-empty-array-key to localStorage due to quota limits');

    consoleSpy.mockRestore();
  });
});
