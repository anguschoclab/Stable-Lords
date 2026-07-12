import { describe, it, expect } from 'vitest';
import { cryptoRandom, cryptoRandomInt } from '@/utils/cryptoRandom';

describe('cryptoRandom', () => {
  it('cryptoRandom throws when crypto is not available', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });

    expect(() => cryptoRandom()).toThrow(/Secure random/);

    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('cryptoRandomInt throws when crypto is not available', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });

    expect(() => cryptoRandomInt(1, 10)).toThrow(/Secure random/);

    Object.defineProperty(globalThis, 'crypto', { value: originalCrypto, configurable: true });
  });

  it('cryptoRandom throws when crypto exists but getRandomValues is missing', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });

    expect(() => cryptoRandom()).toThrow(/Secure random/);

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
