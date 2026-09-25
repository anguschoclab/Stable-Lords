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
// bun:test has no type declarations; this preload only ever executes under
// Bun's native runner (bunfig.toml [test].preload), so suppress the lookup.
// @ts-expect-error — runtime-only Bun module
import { mock as bunMock } from 'bun:test';

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

// bun:test's spyOn cannot mock accessor properties — e.g. Zod 4 defines
// schema methods like `parse` as prototype getters, so
// vi.spyOn(schema, 'parse') throws "does not support accessor properties".
// When the resolved descriptor is an accessor, shadow it with an own data
// property that forwards to a swappable implementation. Repeated spies on the
// same property reuse the installed shim so beforeEach re-mocking works.
if (v.spyOn && !v.__spyOnHandlesAccessors) {
  const origSpyOn = v.spyOn.bind(v);
  v.spyOn = (obj: object, prop: string | symbol) => {
    const ownDesc = Object.getOwnPropertyDescriptor(obj, prop);
    if (
      ownDesc &&
      typeof ownDesc.value === 'function' &&
      ownDesc.value.__accessorShim
    ) {
      return ownDesc.value;
    }
    let holder: any = obj;
    let desc: PropertyDescriptor | undefined;
    while (
      holder != null &&
      !(desc = Object.getOwnPropertyDescriptor(holder, prop))
    ) {
      holder = Object.getPrototypeOf(holder);
    }
    if (!desc || typeof desc.get !== 'function') {
      return origSpyOn(obj, prop as never);
    }
    let realFn: unknown;
    try {
      realFn = desc.get.call(obj);
    } catch {
      realFn = undefined;
    }
    const defaultImpl = (...args: unknown[]) =>
      typeof realFn === 'function'
        ? (realFn as any).apply(obj, args)
        : desc.get!.call(obj)(...args);
    let impl: any = defaultImpl;
    // Build on bun's native fn-mock so expect().toHaveBeenCalled*() and
    // vi.clearAllMocks() recognize it — bun tracks mocks internally.
    const mock: any = bunMock(function (this: unknown, ...args: unknown[]) {
      return impl.apply(this, args);
    });
    // bun's mock methods live on a shared non-writable prototype — shadow
    // them with own properties so chainable impl-swapping works.
    const def = (name: string, value: unknown) =>
      Object.defineProperty(mock, name, {
        value,
        writable: true,
        configurable: true,
      });
    def('__accessorShim', true);
    def('mockImplementation', (fn: any) => {
      impl = fn;
      return mock;
    });
    def('mockReturnValue', (value: unknown) => {
      impl = () => value;
      return mock;
    });
    def('mockResolvedValue', (value: unknown) => {
      impl = () => Promise.resolve(value);
      return mock;
    });
    def('mockRejectedValue', (err: unknown) => {
      impl = () => Promise.reject(err);
      return mock;
    });
    def('mockImplementationOnce', (fn: any) => {
      const prev = impl;
      impl = function (this: unknown, ...a: unknown[]) {
        impl = prev;
        return fn.apply(this, a);
      };
      return mock;
    });
    def('mockReset', () => {
      // Native mockClear lives on the non-writable proto — reach it there to
      // clear bun's internal call log without touching our dispatcher.
      Object.getPrototypeOf(mock).mockClear?.call(mock);
      impl = defaultImpl;
      return mock;
    });
    def('mockRestore', () => {
      if (ownDesc) Object.defineProperty(obj, prop, ownDesc);
      else Reflect.deleteProperty(obj, prop);
    });
    Object.defineProperty(obj, prop, {
      value: mock,
      writable: true,
      configurable: true,
    });
    return mock;
  };
  v.__spyOnHandlesAccessors = true;
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
