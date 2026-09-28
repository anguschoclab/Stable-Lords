import { vi } from 'vitest';

/** Shared stub for @/state/useGameStore driven by a mutable state ref.
 *  Tests set `mockStateRef.current = {...}` in beforeEach. */
export const mockStateRef: { current: Record<string, unknown> } = { current: {} };
export const useGameStore = vi.fn(
  (selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(mockStateRef.current) : mockStateRef.current
);
