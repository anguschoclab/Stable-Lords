import { describe, it, expect, vi } from 'vitest';

const mockWrap = vi.fn((obj: unknown) => obj);
const mockWorkerCtor = vi.fn(function (this: unknown) {
  return { postMessage: vi.fn(), terminate: vi.fn(), addEventListener: vi.fn() };
});

vi.mock('comlink', () => ({
  wrap: mockWrap,
}));

vi.stubGlobal('Worker', mockWorkerCtor);

describe('archiveWorkerProxy — lazy Web Worker (no eager spawn, no dev-mode fallback)', () => {
  it('does NOT create a Worker on import — spawns on first flushLogs call', async () => {
    // Critical when imported inside the engine worker: an eager Worker here
    // would spawn a nested worker during engine module init.
    const { archiveWorkerProxy } = await import('@/engine/storage/archiveWorkerProxy');
    expect(mockWorkerCtor).not.toHaveBeenCalled();
    expect(mockWrap).not.toHaveBeenCalled();

    // First call builds the proxy. The mocked wrap returns the bare Worker
    // stub (no flushLogs), so the call itself throws — we only care that the
    // constructor + wrap ran.
    try {
      archiveWorkerProxy.flushLogs([]);
    } catch {
      /* mocked wrap returns the worker stub without flushLogs */
    }
    expect(mockWorkerCtor).toHaveBeenCalledTimes(1);
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });
});
