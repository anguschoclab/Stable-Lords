import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/engine/runtime/workerProxy', () => ({ ...__SHARED_MOCKS.engineProxy }));

vi.mock('@/engine/storage/opfsArchive', () => ({ ...__SHARED_MOCKS.opfsArchive }));

import '@/test/_setup/setup';
import { useGameStore } from '@/state/createStore';
import { clearReconstructionCache, reconstructGameState } from '@/state/serialization';

describe('storeReconstructionGuards', () => {
  beforeEach(() => {
    useGameStore.getState().doReset?.();
    clearReconstructionCache();
  });

  it('reconstructGameState returns a valid GameState from store', () => {
    const state = reconstructGameState(useGameStore.getState());
    expect(state).toBeDefined();
    expect(typeof state.treasury).toBe('number');
    expect(typeof state.week).toBe('number');
    expect(Array.isArray(state.roster)).toBe(true);
    expect(state.meta).toBeDefined();
    expect(state.meta.gameName).toBeDefined();
  });

  it('reconstructGameState computes absoluteWeek from year and week', () => {
    useGameStore.setState({ year: 2, week: 10 });
    clearReconstructionCache();
    const state = reconstructGameState(useGameStore.getState());
    expect(state.absoluteWeek).toBeGreaterThan(0);
  });

  it('reconstructGameState cache returns same reference when nothing changes', () => {
    const store = useGameStore.getState();
    const result1 = reconstructGameState(store);
    const result2 = reconstructGameState(store);
    expect(result1).toBe(result2); // Same reference from cache
  });

  it('reconstructGameState cache invalidates when a field changes', () => {
    const store = useGameStore.getState();
    const result1 = reconstructGameState(store);

    // Change a field
    useGameStore.setState({ treasury: 5000 });
    const result2 = reconstructGameState(useGameStore.getState());
    expect(result2).not.toBe(result1);
    expect(result2.treasury).toBe(5000);
  });

  it('clearReconstructionCache forces fresh reconstruction', () => {
    const store = useGameStore.getState();
    const result1 = reconstructGameState(store);
    clearReconstructionCache();
    const result2 = reconstructGameState(store);
    expect(result2).not.toBe(result1);
  });
});
