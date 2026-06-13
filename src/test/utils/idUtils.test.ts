import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateId, setMockIdGenerator } from '@/utils/idUtils';
import { SeededRNG } from '@/utils/random';

describe('idUtils', () => {
  beforeEach(() => {
    setMockIdGenerator(null);
  });

  afterEach(() => {
    setMockIdGenerator(null);
  });

  describe('setMockIdGenerator', () => {
    it('uses the mock generator when set', () => {
      setMockIdGenerator(() => 'mocked-id-123');
      const id = generateId();
      expect(id).toBe('mocked-id-123');
    });

    it('falls back to default generators when mock is null', () => {
      setMockIdGenerator(null);
      const id = generateId();
      expect(id).toBeDefined();
      expect(id).not.toBe('mocked-id-123');
    });
  });

  describe('generateId', () => {
    it('uses the rng generator if provided', () => {
      const mockRng = { uuid: vi.fn().mockReturnValue('rng-uuid') } as unknown as SeededRNG;
      const id = generateId(mockRng);

      expect(id).toBe('rng-uuid');
      expect(mockRng.uuid).toHaveBeenCalled();
    });

    it('passes the prefix to the rng generator', () => {
      const mockRng = { uuid: vi.fn().mockReturnValue('rng-uuid-prefix') } as unknown as SeededRNG;
      const id = generateId(mockRng, 'myPrefix');

      expect(id).toBe('rng-uuid-prefix');
      expect(mockRng.uuid).toHaveBeenCalledWith('myPrefix');
    });

    it('uses crypto.randomUUID when available', () => {
      const id = generateId();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('falls back to getRandomValues when randomUUID is unavailable', () => {
      const originalCrypto = globalThis.crypto;

      // Setup a mock crypto object with only getRandomValues
      const mockCrypto = {
        getRandomValues: (arr: Uint8Array) => {
          for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
          }
          return arr;
        }
      };

      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true
      });

      const id = generateId();

      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      // UUID format roughly matches: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

      // Restore
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });

    it('throws an error when no secure RNG is available', () => {
      const originalCrypto = globalThis.crypto;

      // Remove crypto completely
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(() => {
        generateId();
      }).toThrow('Secure random number generator not available in this environment.');

      // Restore
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    });
  });
});
