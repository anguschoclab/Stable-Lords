import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { enableMapSet } from 'immer';
import { clearWarriorCache as clearTournamentCache } from '@/engine/matchmaking/tournament/tournamentStateMutator';
import { clearWarriorCache as clearSelectionCache } from '@/engine/matchmaking/tournamentSelection/utils';
import { clearHistoryResolverCaches } from '@/utils/historyResolver';

enableMapSet();

/**
 * Mock localStorage implementation for Bun/Vitest environment.
 * Provides quota error simulation for testing storage limits.
 */
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  let quotaExceeded = false;

  return {
    /**
     * Get an item from the mock storage.
     * @param key - The key to retrieve.
     * @returns The value associated with the key, or null if not found.
     */
    getItem: function (key: string) {
      return store[key] || null;
    },
    /**
     * Set an item in the mock storage.
     * @param key - The key to set.
     * @param value - The value to store.
     * @throws If quota is exceeded.
     */
    setItem: function (key: string, value: string) {
      if (quotaExceeded) {
        const error = new Error('QuotaExceededError');
        (error as any).name = 'QuotaExceededError';
        throw error;
      }
      store[key] = value.toString();
    },
    /**
     * Remove an item from the mock storage.
     * @param key - The key to remove.
     */
    removeItem: function (key: string) {
      const { [key]: _, ...rest } = store;
      store = rest;
    },
    /**
     * Clear all items from the mock storage.
     */
    clear: function () {
      store = {};
    },
    /**
     * Set whether quota should be exceeded for testing.
     * @param exceeded - Whether to simulate quota exceeded state.
     */
    _setQuotaExceeded: function (exceeded: boolean) {
      quotaExceeded = exceeded;
    },
    /**
     * Get all keys in the mock storage.
     * @returns Array of all keys.
     */
    _getAllKeys: function () {
      return Object.keys(store);
    },
    /**
     * Reset the quota exceeded state to false.
     */
    _resetQuota: function () {
      quotaExceeded = false;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

type OPFSOp =
  | 'getDirectory'
  | 'getDirectoryHandle'
  | 'getFileHandle'
  | 'createWritable'
  | 'write'
  | 'close'
  | 'getFile'
  | 'values'
  | 'text';

let mockOpfsError: { name: string; target: OPFSOp | 'all' } | null = null;
let mockOpfsFileText: string | null = null;

function throwIfTargeted(target: OPFSOp) {
  if (mockOpfsError && (mockOpfsError.target === 'all' || mockOpfsError.target === target)) {
    const err = new Error(mockOpfsError.name);
    (err as any).name = mockOpfsError.name;
    throw err;
  }
}

/**
 * Configure the OPFS mock to throw a named error on the next targeted operation.
 * @param name - The Error.name to throw (e.g. 'QuotaExceededError', 'NotFoundError').
 * @param target - The specific OPFS operation to fail, or 'all' for every operation.
 */
export function setMockOPFSError(name: string, target: OPFSOp | 'all' = 'all'): void {
  mockOpfsError = { name, target };
}

/**
 * Clear any configured OPFS error so subsequent operations succeed.
 */
export function clearMockOPFSError(): void {
  mockOpfsError = null;
  mockOpfsFileText = null;
}

/**
 * Override the text content returned by the mock file's text() method.
 * @param text - The string to return from file.text().
 */
export function setMockOPFSFileText(text: string): void {
  mockOpfsFileText = text;
}

/**
 * Create a mock FileSystemDirectoryHandle for OPFS testing.
 * @param name - The name of the directory.
 * @returns A mock directory handle with nested file/directory capabilities.
 */
const createMockDirHandle = (name: string) => ({
  kind: 'directory' as const,
  name,
  getDirectoryHandle: async (dirName: string, _opts?: { create?: boolean }) => {
    throwIfTargeted('getDirectoryHandle');
    return createMockDirHandle(dirName);
  },
  getFileHandle: async (_name?: string, _opts?: { create?: boolean }) => {
    throwIfTargeted('getFileHandle');
    return {
      kind: 'file' as const,
      createWritable: async () => {
        throwIfTargeted('createWritable');
        return {
          write: async () => {
            throwIfTargeted('write');
          },
          close: async () => {
            throwIfTargeted('close');
          },
        };
      },
      getFile: async () => {
        throwIfTargeted('getFile');
        return {
          text: async () => {
            throwIfTargeted('text');
            return mockOpfsFileText ?? '{}';
          },
        };
      },
    };
  },
  values: async function* () {
    throwIfTargeted('values');
    yield* [];
  },
});

// Set up navigator.storage mock at top level (before any tests run)
if (typeof global.navigator === 'undefined') {
  (global as any).navigator = {};
}

Object.defineProperty(global.navigator, 'storage', {
  value: {
    getDirectory: async () => {
      throwIfTargeted('getDirectory');
      return createMockDirHandle('root');
    },
  },
  configurable: true,
});

// Reset localStorage and OPFS mock before each test
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
    (localStorage as any)._resetQuota?.();
  }
  clearMockOPFSError();
});

// Clear vi mocks after each test to prevent state pollution
afterEach(() => {
  vi.restoreAllMocks();
});

// Clear module-level WeakMap caches to prevent state pollution across tests
afterEach(() => {
  try {
    clearTournamentCache?.();
    clearSelectionCache?.();
    clearHistoryResolverCaches?.();
  } catch (e) {
    // Ignore if modules don't export clear functions
  }
});

// Clear module cache for tests that modify global state
afterEach(() => {
  try {
    // Clear OPFS-related modules that may have cached state
    vi.unmock('@/engine/storage/opfsArchive');
  } catch (e) {
    // Ignore if module doesn't exist
  }
});

// Clean up rendered components after each test in jsdom environment
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver for JSDOM

/**
 * Mock ResizeObserver for JSDOM environment.
 */
class MockResizeObserver {
  /**
   * Observe a target element (no-op in mock).
   */
  observe() {}
  /**
   * Unobserve a target element (no-op in mock).
   */
  unobserve() {}
  /**
   * Disconnect all observations (no-op in mock).
   */
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as typeof ResizeObserver;

/**
 * Mock Worker for Vitest environment.
 * Simulates Web Worker behavior for testing.
 */
class MockWorker {
  url: string;
  onmessage: (event: MessageEvent) => void = () => {};
  onerror: (event: ErrorEvent) => void = () => {};

  /**
   * Create a new mock worker.
   * @param stringUrl - The URL for the worker script.
   */
  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  /**
   * Post a message to the worker.
   * @param _msg - The message to post (ignored in mock).
   */
  postMessage(_msg: unknown) {
    setTimeout(() => {
      this.onmessage({ data: { type: 'WORKER_READY' } } as MessageEvent);
    }, 0);
  }

  /**
   * Terminate the worker (no-op in mock).
   */
  terminate() {}
  /**
   * Add an event listener (no-op in mock).
   */
  addEventListener() {}
  /**
   * Remove an event listener (no-op in mock).
   */
  removeEventListener() {}
  /**
   * Dispatch an event (always returns true in mock).
   * @returns True.
   */
  dispatchEvent(): boolean {
    return true;
  }
}
global.Worker = MockWorker as unknown as typeof Worker;
