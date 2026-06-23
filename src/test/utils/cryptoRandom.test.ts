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

describe('cryptoRandom (crypto available)', () => {
  it('returns float in [0, 1) over many iterations', () => {
    for (let i = 0; i < 100; i++) {
      const val = cryptoRandom();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe('cryptoRandomInt edge cases', () => {
  it('returns min when min == max', () => {
    expect(cryptoRandomInt(5, 5)).toBe(5);
  });

  it('handles negative range', () => {
    for (let i = 0; i < 20; i++) {
      const val = cryptoRandomInt(-10, -5);
      expect(val).toBeGreaterThanOrEqual(-10);
      expect(val).toBeLessThanOrEqual(-5);
    }
  });

  it('range of 1 returns either bound', () => {
    const val = cryptoRandomInt(5, 6);
    expect(val === 5 || val === 6).toBe(true);
  });
});
