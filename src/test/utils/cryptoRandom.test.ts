import { describe, it, expect, vi } from 'vitest';
import { cryptoRandom, cryptoRandomInt } from '@/utils/cryptoRandom';

describe('cryptoRandom', () => {
  it('cryptoRandom falls back to Math.random when crypto is not available', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    const mathSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(cryptoRandom()).toBe(0.5);

    mathSpy.mockRestore();
    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('cryptoRandomInt generates within bounds inclusive', () => {
    const val = cryptoRandomInt(1, 10);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(10);
  });
});
