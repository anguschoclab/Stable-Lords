/**
 * Bun-native test runner bootstrap.
 * Initializes jsdom and all vitest setup mocks so `bun test` behaves like `bun run test`.
 * Loaded automatically via bunfig.toml [test] preload.
 */
// @ts-ignore — jsdom has no declaration file; loaded from node_modules at runtime
import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

// Polyfill vi.mocked and vi.hoisted for Bun compatibility
// vi.mocked is type-only at runtime; vi.hoisted is needed for hoisted mock variables
if (!(vi as any).mocked) {
  (vi as any).mocked = (fn: any) => fn;
}
if (!(vi as any).hoisted) {
  (vi as any).hoisted = (fn: any) => fn();
}

// Global flag so tests can conditionally skip under Bun's native runner
(globalThis as any).__IS_BUN__ = typeof process !== 'undefined' && !!process.versions?.bun;

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

// Set globals as actual own properties BEFORE any @testing-library imports
Object.defineProperty(globalThis, 'window', {
  value: dom.window,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'document', {
  value: dom.window.document,
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true,
});
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).Node = dom.window.Node;
(globalThis as any).Text = dom.window.Text;
(globalThis as any).DocumentFragment = dom.window.DocumentFragment;
(globalThis as any).getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
(globalThis as any).SVGElement = dom.window.SVGElement;
(globalThis as any).requestAnimationFrame = dom.window.requestAnimationFrame?.bind(dom.window) ?? ((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0));
(globalThis as any).cancelAnimationFrame = dom.window.cancelAnimationFrame?.bind(dom.window) ?? ((id: number) => clearTimeout(id));
(globalThis as any).getSelection = dom.window.getSelection?.bind(dom.window) ?? (() => ({ rangeCount: 0, toString: () => '' }));

// FileReader: proxy global to dom.window so test overrides via window.FileReader work
if (!(globalThis as any).FileReader) {
  Object.defineProperty(globalThis, 'FileReader', {
    get: () => dom.window.FileReader,
    set: (v) => { dom.window.FileReader = v; },
    configurable: true,
  });
}

// Now that jsdom is initialized, load the standard vitest setup
import './setup';

// Ensure localStorage has custom test helpers (Bun may provide its own localStorage)
if (typeof localStorage !== 'undefined') {
  const ls = localStorage as any;
  if (!ls._setQuotaExceeded) {
    ls._setQuotaExceeded = (exceeded: boolean) => {
      (ls as any).__quotaExceeded = exceeded;
      const origSetItem = ls.setItem.bind(ls);
      ls.setItem = (key: string, value: string) => {
        if ((ls as any).__quotaExceeded) {
          const err = new Error('QuotaExceededError');
          (err as any).name = 'QuotaExceededError';
          throw err;
        }
        return origSetItem(key, value);
      };
    };
  }
  if (!ls._resetQuota) {
    ls._resetQuota = () => {
      (ls as any).__quotaExceeded = false;
    };
  }
}

// Monkey-patch @testing-library/dom screen if it was loaded before document existed
// (Bun may cache the module before the preload runs)
import { getQueriesForElement } from '@testing-library/dom';
import * as tlDom from '@testing-library/dom';
if ((tlDom as any).screen && typeof document !== 'undefined' && document.body) {
  try {
    (tlDom as any).screen.getByText();
  } catch (e) {
    // screen was initialized with broken helpers — patch them
    const working = getQueriesForElement(document.body);
    Object.assign((tlDom as any).screen, working);
  }
}
