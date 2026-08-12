import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWrap = vi.fn((obj: unknown) => obj);
const mockWorkerCtor = vi.fn(function (this: unknown) {
  return { postMessage: vi.fn(), terminate: vi.fn(), addEventListener: vi.fn() };
});

vi.mock('comlink', () => ({
  wrap: mockWrap,
}));

vi.stubGlobal('Worker', mockWorkerCtor);

describe('workerProxy — always uses Web Worker (no dev-mode fallback)', () => {
  beforeEach(() => {
    mockWrap.mockClear();
    mockWorkerCtor.mockClear();
  });

  it('creates a Worker instance on import (not a dev-mode main-thread proxy)', async () => {
    vi.resetModules();
    await import('@/engine/workerProxy');
    expect(mockWorkerCtor).toHaveBeenCalledTimes(1);
  });

  it('wraps the Worker with Comlink.wrap', async () => {
    vi.resetModules();
    await import('@/engine/workerProxy');
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });

  it('does not use dev-mode fallback (only Worker + Comlink.wrap)', async () => {
    vi.resetModules();
    await import('@/engine/workerProxy');
    // In worker mode, only Worker constructor + Comlink.wrap should be called.
    // The dev fallback would NOT call Worker or Comlink.wrap.
    expect(mockWorkerCtor).toHaveBeenCalledTimes(1);
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });
});
