import { vi } from 'vitest';
import type { Mock } from 'vitest';

/**
 * Shared Web Worker + comlink harness for worker-proxy specs.
 *
 * Each spec calls `makeWorkerMocks()` at module scope for a fresh pair —
 * instances must not be shared across files since both assert call counts:
 *
 *   const { mockWrap, mockWorkerCtor } = __SHARED_MOCKS.workerProxy.makeWorkerMocks();
 *   vi.mock('comlink', () => ({ wrap: mockWrap }));
 *   vi.stubGlobal('Worker', mockWorkerCtor);
 */
export const makeWorkerMocks = (): { mockWrap: Mock; mockWorkerCtor: Mock } => ({
  mockWrap: vi.fn((obj: unknown) => obj),
  mockWorkerCtor: vi.fn(function (this: unknown) {
    return { postMessage: vi.fn(), terminate: vi.fn(), addEventListener: vi.fn() };
  }),
});
