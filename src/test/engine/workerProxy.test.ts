import { describe, it, expect, vi } from 'vitest';

const mockWrap = vi.fn((obj: unknown) => obj);
const mockWorkerCtor = vi.fn(function (this: unknown) {
  return { postMessage: vi.fn(), terminate: vi.fn(), addEventListener: vi.fn() };
});

vi.mock('comlink', () => ({
  wrap: mockWrap,
}));

vi.stubGlobal('Worker', mockWorkerCtor);

describe('workerProxy — lazy Web Worker (no eager spawn, no dev-mode fallback)', () => {
  it('does NOT create a Worker on import — spawns on first method access', async () => {
    // The engine worker is heavy and must not start during module
    // initialization (tests, Node harnesses, nested worker contexts).
    const { engineProxy } = await import('@/engine/workerProxy');
    expect(mockWorkerCtor).not.toHaveBeenCalled();
    expect(mockWrap).not.toHaveBeenCalled();

    // First property access builds the proxy.
    void engineProxy.advanceWeek;
    expect(mockWorkerCtor).toHaveBeenCalledTimes(1);
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });
});
