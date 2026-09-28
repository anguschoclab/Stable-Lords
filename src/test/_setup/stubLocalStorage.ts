import { vi } from 'vitest';

/** Installs an inert localStorage stub on globalThis (node env autosim tests). */
export function stubLocalStorage() {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    },
    configurable: true,
  });
}
