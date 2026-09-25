/**
 * Bun-native test runner bootstrap.
 * Initializes jsdom and all vitest setup mocks so `bun test` behaves like `bun run test`.
 * Loaded automatically via bunfig.toml [test] preload — ordered AFTER
 * bunViPolyfill.ts, which installs the `vi` API shims this file's ./setup
 * import needs (ESM hoisting prevents self-shimming here).
 */
import { JSDOM } from 'jsdom';

// Global flag so tests can conditionally skip under Bun's native runner
(globalThis as any).__IS_BUN__ = typeof process !== 'undefined' && !!process.versions?.bun;

// Scripts guard their main() behind `if (!process.env.VITEST)` — bun:test is a
// vitest-compatible run, so mark it the same way or importing them calls
// process.exit(1) and kills the in-process runner.
process.env.VITEST ??= 'true';

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
(globalThis as any).requestAnimationFrame =
  dom.window.requestAnimationFrame?.bind(dom.window) ??
  ((cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0));
(globalThis as any).cancelAnimationFrame =
  dom.window.cancelAnimationFrame?.bind(dom.window) ?? ((id: number) => clearTimeout(id));
(globalThis as any).getSelection =
  dom.window.getSelection?.bind(dom.window) ?? (() => ({ rangeCount: 0, toString: () => '' }));

// FileReader: proxy global to dom.window so test overrides via window.FileReader work
if (!(globalThis as any).FileReader) {
  Object.defineProperty(globalThis, 'FileReader', {
    get: () => dom.window.FileReader,
    set: (v) => {
      dom.window.FileReader = v;
    },
    configurable: true,
  });
}

// Copy every remaining jsdom global that Bun doesn't already provide
// (HTMLAnchorElement, HTMLInputElement, PointerEvent, localStorage, ...).
// `in globalThis` keeps Bun natives (fetch, setTimeout) and the FileReader
// proxy untouched — EXCEPT event classes: Bun ships its own Event/
// EventTarget realm, and jsdom's dispatchEvent rejects events from another
// realm ("parameter 1 is not of type 'Event'"), so jsdom's must win there.
for (const key of Object.getOwnPropertyNames(dom.window)) {
  const mustOverride =
    key === 'EventTarget' ||
    key.endsWith('Event') ||
    // Bun ships its own localStorage/sessionStorage — tests must see the
    // jsdom window's storage so `localStorage` and `window.localStorage`
    // are the same object.
    key === 'localStorage' ||
    key === 'sessionStorage' ||
    // Bun's AbortSignal instances get rejected by jsdom's addEventListener
    // ({ signal }) — framer-motion gesture listeners hit this.
    key === 'AbortSignal' ||
    key === 'AbortController' ||
    // Bun's native Blob/File are a different realm: jsdom's FileReader
    // silently fails to read them, stalling upload paths (Mods/ImportExport).
    key === 'Blob' ||
    key === 'File';
  if (!mustOverride && key in globalThis) continue;
  const desc = Object.getOwnPropertyDescriptor(dom.window, key);
  if (desc) Object.defineProperty(globalThis, key, desc);
}

// jsdom never implemented these — Radix Select/Slider/Tooltip call them.
// Individual test files stub scrollIntoView ad hoc; Radix interactions need
// them everywhere, so stub once here.
const elementProto = dom.window.Element.prototype as any;
elementProto.scrollIntoView ??= () => {};
elementProto.hasPointerCapture ??= () => false;
elementProto.setPointerCapture ??= () => {};
elementProto.releasePointerCapture ??= () => {};

// Now that jsdom is initialized, load the standard vitest setup. These MUST be
// dynamic imports: a static `import './setup'` is hoisted above this file's
// body, so setup.ts's graph (@testing-library/react → react-dom) would
// evaluate with canUseDOM === false — permanently disabling React's onChange
// (isInputEventSupported falls back to the IE attachEvent polyfill path).
await import('./setup');

// Monkey-patch @testing-library/dom screen if it was loaded before document existed
// (Bun may cache the module before the preload runs)
const tlDom = await import('@testing-library/dom');
if ((tlDom as any).screen && typeof document !== 'undefined' && document.body) {
  try {
    (tlDom as any).screen.getByText();
  } catch (e) {
    // screen was initialized with broken helpers — patch them
    const working = tlDom.getQueriesForElement(document.body);
    Object.assign((tlDom as any).screen, working);
  }
}
