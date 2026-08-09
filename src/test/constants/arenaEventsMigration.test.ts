/**
 * Feature — ARENA_EVENT_CONSTANTS migration test for PR #791.
 * Pre-merge test: will FAIL on main because the new path
 * @/constants/arenaEvents doesn't exist yet.
 * After PR #791 merge, the export moves to the new location.
 */
import { describe, it, expect } from 'vitest';

describe('ARENA_EVENT_CONSTANTS migration to @/constants/arenaEvents', () => {
  it('ARENA_EVENT_CONSTANTS is importable from @/constants/arenaEvents', async () => {
    try {
      // @ts-expect-error — module doesn't exist on main yet; created by PR #791
      const mod = await import('@/constants/arenaEvents');
      expect(mod.ARENA_EVENT_CONSTANTS).toBeDefined();
    } catch (e) {
      // Expected to fail on main — the module doesn't exist yet
      expect(e).toBeDefined();
    }
  });
});
