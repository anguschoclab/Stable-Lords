/**
 * Dependency — vitest API surface canary. The four APIs below are the ones the
 * suite depends on most; if an upgrade removes or renames one, this fails fast
 * instead of producing cryptic breakage across hundreds of specs.
 */
import { describe, it, expect, vi } from 'vitest';

describe('vitest API compatibility', () => {
  it('vi.mock is available', () => {
    expect(typeof vi.mock).toBe('function');
  });

  it('vi.fn is available', () => {
    expect(typeof vi.fn).toBe('function');
  });

  it('vi.spyOn is available', () => {
    expect(typeof vi.spyOn).toBe('function');
  });

  it('vi.resetModules is available', () => {
    expect(typeof vi.resetModules).toBe('function');
  });
});
