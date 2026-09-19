/**
 * Bun <-> Vitest `vi` API compatibility layer.
 *
 * bun:test's `vi` alias implements only a subset of vitest's API. This preload
 * installs minimal shims for the APIs this suite depends on. It MUST be the
 * first entry in bunfig.toml `[test].preload` — bun-setup.ts imports setup.ts,
 * whose top-level `vi.unmock()` executes before bun-setup's own body (ESM
 * import hoisting), so these shims cannot live inside bun-setup.ts.
 *
 * Every shim only installs when the API is absent, so a future Bun release
 * with native support wins automatically. APIs whose semantics cannot be
 * mapped onto bun:test get descriptive throwers — a loud error beats
 * silently-wrong behavior.
 *
 * Loaded automatically via bunfig.toml. Never imported by vitest
 * (vitest.config.ts does not reference bunfig preload files).
 */
import { describe, it, test, vi } from 'vitest';

const v = vi as Record<string, any>;

// ---------------------------------------------------------------------------
// Functional shims — APIs the suite actually calls
// ---------------------------------------------------------------------------

if (!v.waitFor) {
  // Poll `cb` until it stops throwing; rethrow the last error on timeout.
  // Iteration-bounded (not Date.now) so faked clocks can't break the deadline.
  v.waitFor = async (
    cb: () => unknown | Promise<unknown>,
    opts: { timeout?: number; interval?: number } = {},
  ) => {
    const { timeout = 1000, interval = 50 } = opts;
    const maxChecks = Math.max(1, Math.ceil(timeout / interval));
    let lastError: unknown;
    for (let i = 0; ; i++) {
      try {
        return await cb();
      } catch (e) {
        lastError = e;
        if (i >= maxChecks) throw lastError;
        if (v.isFakeTimers?.()) {
          v.advanceTimersByTime(interval);
        } else {
          await new Promise((r) => setTimeout(r, interval));
        }
      }
    }
  };
}

if (!v.unmock) {
  // bun's mock.module registrations are scoped per test file — there is no
  // global mock registry to clear, so unmock is vacuously satisfied.
  v.unmock = (_path?: string) => {};
}
if (!v.doUnmock) {
  v.doUnmock = (_path?: string) => {};
}

// bun treats ?-suffixed specifiers as distinct modules and does NOT apply
// mock.module registrations to them — the escape hatch for importActual.
const actualUrl = (p: string) => `${p}${p.includes('?') ? '&' : '?'}__actual__=1`;
if (!v.importActual) {
  v.importActual = (path: string) => import(actualUrl(path));
}

// vitest passes an `importOriginal` arg to async vi.mock factories; bun passes
// nothing. Wrap vi.mock so factories always receive a working importOriginal.
if (!v.__mockWrappedForImportOriginal) {
  const origMock = v.mock.bind(v);
  v.mock = (path: string, factory?: (importOriginal?: any) => unknown) =>
    origMock(
      path,
      factory ? async () => factory(() => import(actualUrl(path))) : factory,
    );
  v.__mockWrappedForImportOriginal = true;
}

const stubbedGlobals = new Map<string, { had: boolean; original: unknown }>();
if (!v.stubGlobal) {
  v.stubGlobal = (name: string, value: unknown) => {
    if (!stubbedGlobals.has(name)) {
      stubbedGlobals.set(name, {
        had: Object.prototype.hasOwnProperty.call(globalThis, name),
        original: (globalThis as any)[name],
      });
    }
    Object.defineProperty(globalThis, name, {
      value,
      writable: true,
      configurable: true,
    });
    return v;
  };
}
if (!v.unstubAllGlobals) {
  v.unstubAllGlobals = () => {
    for (const [name, { had, original }] of stubbedGlobals) {
      if (had) {
        Object.defineProperty(globalThis, name, {
          value: original,
          writable: true,
          configurable: true,
        });
      } else {
        Reflect.deleteProperty(globalThis, name);
      }
    }
    stubbedGlobals.clear();
  };
}

if (!v.runAllTimersAsync) {
  // Drain pending fake timers, flushing microtasks between rounds so
  // promise-yielding timer callbacks can reschedule. Mirrors vitest's
  // 10_000-timer abort budget.
  v.runAllTimersAsync = async () => {
    const MAX = 10_000;
    let iterations = 0;
    while ((v.getTimerCount?.() ?? 0) > 0) {
      v.runAllTimers();
      await Promise.resolve();
      await Promise.resolve();
      if (++iterations > MAX) {
        throw new Error(`Aborting after running ${MAX} timers (vi.runAllTimersAsync)`);
      }
    }
  };
}

if (!v.dynamicImportSettled) {
  // Best-effort settle: alternate microtask drains with macrotask yields so
  // pending import() promises and their .then continuations complete.
  v.dynamicImportSettled = async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
      await new Promise((r) => setTimeout(r, 0));
    }
  };
}

// ---------------------------------------------------------------------------
// Shims moved here from bun-setup.ts (must be installed before ./setup loads)
// ---------------------------------------------------------------------------

if (!v.mocked) {
  v.mocked = (fn: any) => fn;
}
if (!v.hoisted) {
  v.hoisted = (fn: any) => fn();
}

// ---------------------------------------------------------------------------
// Suite-modifier shims — absent under bun:test, would abort file collection
// ---------------------------------------------------------------------------

for (const suite of [it, test, describe] as any[]) {
  if (suite && !suite.runIf) {
    suite.runIf = (cond: boolean) => (cond ? suite : suite.skip);
  }
}

// ---------------------------------------------------------------------------
// Unmappable APIs — descriptive throwers, not silent no-ops
// ---------------------------------------------------------------------------

const unsupported = (name: string) => () => {
  throw new Error(
    `vi.${name} is not supported under bun:test — restructure the test or run under vitest`,
  );
};
for (const name of [
  'resetModules', // bun's module registry is per-file; intra-file re-eval is unmappable
  'doMock',
  'setSystemTime',
  'getMockedSystemTime',
  'importMock',
  'waitUntil',
  'assertFactory',
]) {
  if (!v[name]) v[name] = unsupported(name);
}
