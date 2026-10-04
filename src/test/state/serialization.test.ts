import { describe, it, expect } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { useGameStore } from '@/state/useGameStore';
import { reconstructGameState } from '@/state/serialization';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import '@/test/_setup/setup';

describe('serialization — progression', () => {
  it('reconstructGameState includes progression from store', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);

    const reconstructed = reconstructGameState(useGameStore.getState());

    expect(reconstructed.progression).toBeDefined();
    expect(reconstructed.progression.status).toBe('active');
    expect(reconstructed.progression.objectives).toHaveLength(
      DEFAULT_PROGRESSION.objectives.length
    );
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

describe('serialization — death registry', () => {
  it('deadWarriorIds and killEvents survive the store round-trip', () => {
    // The dead registry is the canonical liveness authority — if the store
    // hydration or reconstruction drops it, dead-id guards silently decay
    // on every week boundary.
    const mockState = createFreshState('registry-seed');
    mockState.deadWarriorIds = ['w-dead-1' as never, 'w-dead-2' as never];
    mockState.killEvents = [
      {
        id: 'ke-1',
        week: 3,
        victimId: 'w-dead-1' as never,
        killerId: 'w-killer' as never,
      },
      {
        id: 'ke-2',
        week: 4,
        victimId: 'w-dead-2' as never,
        killerId: 'w-killer' as never,
        tournamentId: 't-9' as never,
      },
    ];
    useGameStore.getState().loadGame('test-slot', mockState);

    const reconstructed = reconstructGameState(useGameStore.getState());

    expect(reconstructed.deadWarriorIds).toEqual(['w-dead-1', 'w-dead-2']);
    expect(reconstructed.killEvents).toHaveLength(2);
    expect(reconstructed.killEvents[1]!.tournamentId).toBe('t-9');
  });
});
