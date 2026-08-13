// ESM shim re-exporting howler from the global scope.
// howler.js is loaded via a <script> tag in index.html (non-module,
// non-strict mode) so its spatial plugin's bare HowlerGlobal reference
// resolves to window.HowlerGlobal. This shim makes those available
// as ESM named exports for `import { Howl } from 'howler'`.
// Uses globalThis for Web Worker compatibility (window is undefined in
// workers, but howler is only loaded via script tag in the main thread).
const g = globalThis as unknown as {
  Howl: typeof import('howler').Howl;
  Howler: typeof import('howler').Howler;
};
export const Howl = g.Howl;
export const Howler = g.Howler;
