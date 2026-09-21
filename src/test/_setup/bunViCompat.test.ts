/**
 * Contract test for the `vi` API surface this suite depends on.
 *
 * Runs under BOTH runners: under vitest it exercises the native APIs; under
 * `bun test` it verifies the shims installed by `bunViPolyfill.ts` (the first
 * bunfig.toml preload). Assertions are implementation-agnostic — they pin
 * observable behavior, not internals.
 */
import { describe, it, expect, vi } from 'vitest';

const IS_BUN = (globalThis as any).__IS_BUN__ === true;

describe('vi compat surface (vitest + bun)', () => {
  describe('vi.waitFor', () => {
    it('resolves once the assertion stops throwing', async () => {
      let ready = false;
      setTimeout(() => {
        ready = true;
      }, 10);
      await vi.waitFor(() => {
        expect(ready).toBe(true);
      });
    });

    it('rejects with the last error after the timeout', async () => {
      await expect(
        vi.waitFor(
          () => {
            expect(true).toBe(false);
          },
          { timeout: 100, interval: 10 },
        ),
      ).rejects.toThrow();
    });
  });

  it('vi.unmock is callable', () => {
    // Aliased so vitest's hoisted-directive transform doesn't strip the call.
    const unmock = vi.unmock;
    expect(typeof unmock).toBe('function');
    expect(() => unmock('@/nonexistent-module-contract-probe')).not.toThrow();
  });

  describe('vi.stubGlobal / vi.unstubAllGlobals', () => {
    it('installs a global and restores its prior absence', () => {
      const KEY = '__bunViCompatProbe__';
      expect(KEY in globalThis).toBe(false);
      vi.stubGlobal(KEY, 42);
      expect((globalThis as any)[KEY]).toBe(42);
      vi.unstubAllGlobals();
      expect(KEY in globalThis).toBe(false);
    });
  });

  it('vi.runAllTimersAsync drains pending fake timers', async () => {
    vi.useFakeTimers();
    try {
      let fired = false;
      setTimeout(() => {
        fired = true;
      }, 10);
      await vi.runAllTimersAsync();
      expect(fired).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('vi.dynamicImportSettled resolves', async () => {
    await expect(vi.dynamicImportSettled()).resolves.toBeUndefined();
  });

  describe('vi.resetModules', () => {
    it('is a function', () => {
      expect(typeof vi.resetModules).toBe('function');
    });

    it.skipIf(!IS_BUN)('throws a descriptive error under bun (unmappable)', () => {
      expect(() => vi.resetModules()).toThrow(/not supported|bun/i);
    });
  });

  describe('runIf modifiers', () => {
    it('exposes it.runIf and describe.runIf', () => {
      expect(typeof it.runIf).toBe('function');
      expect(typeof describe.runIf).toBe('function');
    });

    it.runIf(false)('never executes when the condition is false', () => {
      throw new Error('runIf(false) body must not execute');
    });
  });

  it('native suite modifiers used by the repo exist', () => {
    expect(typeof it.each).toBe('function');
    expect(typeof describe.each).toBe('function');
    expect(typeof it.skipIf).toBe('function');
  });
});
