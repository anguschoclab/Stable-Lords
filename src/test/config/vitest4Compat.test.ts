/**
 * Dependency — vitest 4 compatibility check.
 * Pre-merge test: verifies no incompatible vi API usage that would
 * break with vitest 4 upgrade.
 */
import { describe, it, expect, vi } from 'vitest';

describe('vitest 4 compatibility', () => {
  it('vi.mock is available (stable across v3→v4)', () => {
    expect(typeof vi.mock).toBe('function');
  });

  it('vi.fn is available (stable across v3→v4)', () => {
    expect(typeof vi.fn).toBe('function');
  });

  it('vi.spyOn is available (stable across v3→v4)', () => {
    expect(typeof vi.spyOn).toBe('function');
  });

  it('vi.resetModules is available (stable across v3→v4)', () => {
    expect(typeof vi.resetModules).toBe('function');
  });
});
