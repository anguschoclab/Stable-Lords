import '@testing-library/jest-dom';
import { enableMapSet } from 'immer';

enableMapSet();

// Mock localStorage for Bun/Vitest environment
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  let quotaExceeded = false;

  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      if (quotaExceeded) {
        const error = new Error('QuotaExceededError');
        (error as any).name = 'QuotaExceededError';
        throw error;
      }
      store[key] = value.toString();
    },
    removeItem: function (key: string) {
      const { [key]: _, ...rest } = store;
      store = rest;
    },
    clear: function () {
      store = {};
    },
    // Helper for testing quota errors
    _setQuotaExceeded: function (exceeded: boolean) {
      quotaExceeded = exceeded;
    },
    // Helper for getting all keys
    _getAllKeys: function () {
      return Object.keys(store);
    },
    // Helper for resetting quota state
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

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as typeof ResizeObserver;

// Mock OPFS FileSystem interfaces for Vitest
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

// Mock Worker for Vitest

class MockWorker {
  url: string;
  onmessage: (event: MessageEvent) => void = () => {};
  onerror: (event: ErrorEvent) => void = () => {};

  constructor(stringUrl: string) {
    this.url = stringUrl;
  }

  postMessage(_msg: unknown) {
    setTimeout(() => {
      this.onmessage({ data: { type: 'WORKER_READY' } } as MessageEvent);
    }, 0);
  }

  terminate() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent(): boolean {
    return true;
  }
}
global.Worker = MockWorker as unknown as typeof Worker;
