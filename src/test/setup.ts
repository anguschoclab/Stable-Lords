import '@testing-library/jest-dom';
import { enableMapSet } from 'immer';

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

// Reset localStorage before each test
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
    (localStorage as any)._resetQuota?.();
  }
});

// Reset navigator.storage mock before each test
beforeEach(() => {
  const createMockDirHandle = (name: string) => ({
    kind: 'directory',
    name,
    getDirectoryHandle: async (dirName: string) => createMockDirHandle(dirName),
    getFileHandle: async () => ({
      kind: 'file',
      createWritable: async () => ({
        write: async () => {},
        close: async () => {},
      }),
      getFile: async () => ({
        text: async () => '{}',
      }),
    }),
    values: async function* () {},
  });

  if (typeof global.navigator === 'undefined') {
    (global as any).navigator = {};
  }

  Object.defineProperty(global.navigator, 'storage', {
    value: {
      getDirectory: async () => createMockDirHandle('root'),
    },
    configurable: true,
  });
});

// Clear vi mocks after each test to prevent state pollution
afterEach(() => {
  vi.restoreAllMocks();
});

// Clear module-level WeakMap caches to prevent state pollution across tests
afterEach(() => {
  try {
    const { clearWarriorCache: clearTournamentCache } = require('@/engine/matchmaking/tournament/tournamentStateMutator');
    const { clearWarriorCache: clearSelectionCache } = require('@/engine/matchmaking/tournamentSelection/utils');
    const { clearHistoryResolverCaches } = require('@/utils/historyResolver');

    clearTournamentCache?.();
    clearSelectionCache?.();
    clearHistoryResolverCaches?.();
  } catch (e) {
    // Ignore if modules don't export clear functions
  }
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
 * Create a mock FileSystemDirectoryHandle for OPFS testing.
 * @param name - The name of the directory.
 * @returns A mock directory handle with nested file/directory capabilities.
 */
const createMockDirHandle = (name: string) => ({
  kind: 'directory',
  name,
  getDirectoryHandle: async (dirName: string) => createMockDirHandle(dirName),
  getFileHandle: async () => ({
    kind: 'file',
    createWritable: async () => ({
      write: async () => {},
      close: async () => {},
    }),
    getFile: async () => ({
      text: async () => '{}',
    }),
  }),
  values: async function* () {},
});

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = {};
}

Object.defineProperty(global.navigator, 'storage', {
  value: {
    getDirectory: async () => createMockDirHandle('root'),
  },
  configurable: true,
});

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
