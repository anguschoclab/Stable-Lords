/**
 * Cryptographically secure random number generation utilities.
 * Uses crypto.getRandomValues() for all randomness.
 * Falls back to Math.random() only in environments where crypto is unavailable.
 */

function getCrypto(): Crypto | undefined {
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  if (typeof crypto !== 'undefined') {
    return crypto;
  }
  return undefined;
}

/**
 * Returns a cryptographically secure random float in [0, 1).
 * Falls back to Math.random() if crypto is unavailable.
 */
export function cryptoRandom(): number {
  const cryptoObj = getCrypto();
  if (cryptoObj?.getRandomValues) {
    const arr = new Uint32Array(1);
    cryptoObj.getRandomValues(arr);
    return arr[0]! / 4294967296;
  }
  return Math.random();
}

/**
 * Returns a cryptographically secure random integer in [min, max] (inclusive).
 * Falls back to Math.random() if crypto is unavailable.
 */
export function cryptoRandomInt(min: number, max: number): number {
  return Math.floor(cryptoRandom() * (max - min + 1)) + min;
}
