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
import { clearReconstructionCache } from '@/state/serialization';
import { StyleRollups } from '@/engine/stats/styleRollups';

describe('useShallowAdoption', () => {
  beforeEach(() => {
    useGameStore.getState().doReset?.();
    clearReconstructionCache();
    StyleRollups._clearCaches();
  });

  it('store has expected slice structure', () => {
    const state = useGameStore.getState();
    expect(state).toBeDefined();
    expect(typeof state.treasury).toBe('number');
    expect(typeof state.week).toBe('number');
    expect(Array.isArray(state.roster)).toBe(true);
  });

  it('store reset restores initial values', () => {
    const store = useGameStore.getState();
    const initialTreasury = store.treasury;

    // Mutate
    useGameStore.setState({ treasury: 99999 });
    expect(useGameStore.getState().treasury).toBe(99999);

    // Reset
    if (store.doReset) {
      store.doReset();
      expect(useGameStore.getState().treasury).toBe(initialTreasury);
    }
  });

  it('store setState updates slices correctly', () => {
    useGameStore.setState({ treasury: 5000 });
    expect(useGameStore.getState().treasury).toBe(5000);

    useGameStore.setState({ week: 10 });
    expect(useGameStore.getState().week).toBe(10);
  });
});
