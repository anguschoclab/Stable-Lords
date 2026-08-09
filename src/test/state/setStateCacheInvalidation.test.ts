import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/workerProxy', () => ({
  engineProxy: {
    advanceWeek: vi.fn().mockResolvedValue({ week: 2, phase: 'planning' }),
    advanceDay: vi.fn().mockResolvedValue({ week: 1, day: 1, phase: 'planning' }),
    skipToWeekEnd: vi.fn().mockResolvedValue({ week: 2, phase: 'planning' }),
    runAutosim: vi.fn(),
  },
}));

vi.mock('@/engine/storage/opfsArchive', () => ({
  opfsArchive: {
    archiveHotState: vi.fn().mockResolvedValue(undefined),
  },
}));

import '@/test/_setup/setup';
import { useGameStore } from '@/state/createStore';
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('NF4: setState stale cache bug', () => {
  beforeEach(() => {
    useGameStore.getState().doReset?.();
    clearReconstructionCache();
    StyleRollups._clearCaches();
  });

  it('reconstructGameState returns stale data after setState mutates store', () => {
    // Populate cache with current state
    const store = useGameStore.getState();
    const result1 = reconstructGameState(store);
    expect(result1.treasury).toBeDefined();

    // Use setState to mutate the store (this is the public API used by components)
    useGameStore.getState().setState((draft) => {
      draft.treasury = 99999;
    });

    // reconstructGameState should return the NEW treasury, not the cached old value
    // NF4 bug: setState doesn't clear the reconstruction cache, so it may return stale data
    const result2 = reconstructGameState(useGameStore.getState());
    expect(result2.treasury, 'should reflect setState mutation, not stale cache').toBe(99999);
  });

  it('reconstructGameState returns stale roster after setState pushes a warrior', () => {
    const store = useGameStore.getState();
    const result1 = reconstructGameState(store);
    const initialRosterLen = result1.roster.length;

    // Mutate roster via setState
    useGameStore.getState().setState((draft) => {
      draft.roster.push({
        id: 'test-warrior-1',
        name: 'Test Warrior',
        style: 'Striking Attack',
        fame: 0,
        career: { wins: 0, losses: 0, kills: 0 },
        stableId: 'stable-player',
        status: 'Active',
        age: 25,
        attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
        isAlive: true,
        isRetired: false,
      } as any);
    });

    const result2 = reconstructGameState(useGameStore.getState());
    expect(result2.roster.length, 'roster should reflect setState mutation').toBe(
      initialRosterLen + 1
    );
  });
});
