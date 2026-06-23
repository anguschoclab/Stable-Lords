import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { useGameStore } from '@/state/useGameStore';
import { reconstructGameState } from '@/state/serialization';
import '@/test/_setup/setup';

describe('serialization — progression', () => {
  it('reconstructGameState includes progression from store', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);

    const reconstructed = reconstructGameState(useGameStore.getState());

    expect(reconstructed.progression).toBeDefined();
    expect(reconstructed.progression.status).toBe('active');
    expect(reconstructed.progression.objectives).toHaveLength(5);
  });

  it('reconstructGameState reflects progression changes', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);

    useGameStore.setState((s) => ({
      progression: { ...s.progression, stableStanding: 3, totalStables: 11 },
    }));

    const reconstructed = reconstructGameState(useGameStore.getState());

    expect(reconstructed.progression.stableStanding).toBe(3);
    expect(reconstructed.progression.totalStables).toBe(11);
  });
});
