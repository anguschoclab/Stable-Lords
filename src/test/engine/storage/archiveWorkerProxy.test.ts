import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWrap = vi.fn((obj: unknown) => obj);
const mockWorkerCtor = vi.fn(function (this: unknown) {
  return { postMessage: vi.fn(), terminate: vi.fn(), addEventListener: vi.fn() };
});

vi.mock('comlink', () => ({
  wrap: mockWrap,
}));

vi.stubGlobal('Worker', mockWorkerCtor);

describe('archiveWorkerProxy — always uses Web Worker (no dev-mode fallback)', () => {
  beforeEach(() => {
    mockWrap.mockClear();
    mockWorkerCtor.mockClear();
  });

  it('creates a Worker instance on import (not a dev-mode main-thread proxy)', async () => {
    vi.resetModules();
    await import('@/engine/storage/archiveWorkerProxy');
    expect(mockWorkerCtor).toHaveBeenCalledTimes(1);
  });

  it('wraps the Worker with Comlink.wrap', async () => {
    vi.resetModules();
    await import('@/engine/storage/archiveWorkerProxy');
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });
});
