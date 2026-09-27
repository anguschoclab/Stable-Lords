/**
 * DOM-only test setup — loaded for every test file but fully inert under the
 * `node` environment (`document` absent). The ~560 pure engine/logic files in
 * the shared project must not pay for react/react-dom/jest-dom imports, and
 * vitest applies the per-file environment before setup files run, so
 * `document` presence is the correct discriminator.
 *
 * bun-setup always installs jsdom before importing the setup chain, so every
 * gate below is true under Bun — parity is unchanged.
 */

let rtlCleanup: (() => void) | null = null;
if (typeof document !== 'undefined') {
  await import('@testing-library/jest-dom/vitest');
  rtlCleanup = (await import('@testing-library/react/pure')).cleanup;
}

// jsdom does not implement HTMLMediaElement playback — stub the two methods
// AudioManager paths touch so tests don't emit "Not implemented" noise.
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = function () {
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.load = function () {};
}

// Mock ResizeObserver for JSDOM
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver as typeof ResizeObserver;

// Clean up rendered components after each test in jsdom environment
afterEach(() => {
  try {
    rtlCleanup?.();
  } catch {
    // Bun parallel runner can trigger concurrent cleanup()/act() calls;
    // swallow the error so it doesn't cascade to unrelated tests.
  }
});
