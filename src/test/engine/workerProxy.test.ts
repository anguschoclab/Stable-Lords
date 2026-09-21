import { describe, it, expect, vi } from 'vitest';

const mockWrap = vi.fn((obj: unknown) => obj);
const mockWorkerCtor = vi.fn(function (this: unknown) {
  return { postMessage: vi.fn(), terminate: vi.fn(), addEventListener: vi.fn() };
});

vi.mock('comlink', () => ({
  wrap: mockWrap,
}));

vi.stubGlobal('Worker', mockWorkerCtor);

describe('workerProxy — always uses Web Worker (no dev-mode fallback)', () => {
  it('creates a Worker instance and wraps it with Comlink on import', async () => {
    // A single import evaluates the module once — enough to observe the
    // top-level side effect. In worker mode, only the Worker constructor +
    // Comlink.wrap run; the dev fallback calls neither.
    // (vi.resetModules is unavailable under bun:test.)
    await import('@/engine/workerProxy');
    expect(mockWorkerCtor).toHaveBeenCalledTimes(1);
    expect(mockWrap).toHaveBeenCalledTimes(1);
  });
});
