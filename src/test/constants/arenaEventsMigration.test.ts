import { describe, it, expect } from 'vitest';

describe('ARENA_EVENT_CONSTANTS migration to @/constants/arenaEvents', () => {
  it('ARENA_EVENT_CONSTANTS is importable from @/constants/arenaEvents', async () => {
    const mod = await import('@/constants/arenaEvents');
    expect(mod.ARENA_EVENT_CONSTANTS).toBeDefined();
  });
});
