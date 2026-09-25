/**
 * Dependency — toast() compatibility test for sonner 2 upgrade.
 */
import { describe, it, expect } from 'vitest';

describe('toast() — sonner compatibility', () => {
  it('toast function is importable from sonner', async () => {
    const mod = await import('sonner');
    expect(typeof mod.toast).toBe('function');
  });

  it('toast.success is a function', async () => {
    const mod = await import('sonner');
    expect(typeof mod.toast.success).toBe('function');
  });

  it('toast.error is a function', async () => {
    const mod = await import('sonner');
    expect(typeof mod.toast.error).toBe('function');
  });
});
