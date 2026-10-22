import { vi } from 'vitest';
import { dashboardTabState } from '@/test/_fixtures/dashboardTabState';

/** Shared stub for @/state/useGameStore driven by a mutable state ref.
 *  Tests set `mockStateRef.current = {...}` in beforeEach. */
export const mockStateRef: { current: Record<string, unknown> } = { current: {} };
export const useGameStore = vi.fn((selector?: (s: Record<string, unknown>) => unknown) =>
  selector ? selector(mockStateRef.current) : mockStateRef.current
);

/** Gazette/briefing widget seed: two roster warriors + one rival + named player stable. */
export function seedBriefingMockState() {
  mockStateRef.current = dashboardTabState();
}
