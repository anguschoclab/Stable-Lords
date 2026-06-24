import { describe, it, expect } from 'vitest';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import '@/test/_setup/setup';

describe('DEFAULT_PROGRESSION', () => {
  it('has correct shape', () => {
    expect(DEFAULT_PROGRESSION.status).toBe('active');
    expect(DEFAULT_PROGRESSION.stableStanding).toBe(0);
    expect(DEFAULT_PROGRESSION.totalStables).toBe(0);
    expect(DEFAULT_PROGRESSION.objectives).toHaveLength(5);
    expect(DEFAULT_PROGRESSION.objectives.every((o) => o.completed === false)).toBe(true);
    expect(DEFAULT_PROGRESSION.objectives.map((o) => o.id)).toEqual([
      'TOP_10_STABLE',
      'TOP_3_STABLE',
      'FIRST_TOURNAMENT_WIN',
      'HALL_OF_FAMER',
      'REALM_CHAMPION',
    ]);
  });
});

describe('progressionSlice', () => {
  it('acknowledgeWin sets status to continued', () => {
    const store = useGameStore.getState();
    const mockState = createFreshState('test-seed');
    store.loadGame('test-slot', mockState);

    useGameStore.setState((s) => ({
      progression: { ...s.progression, status: 'won' },
    }));

    useGameStore.getState().acknowledgeWin();

    const progression = useGameStore.getState().progression;
    expect(progression.status).toBe('continued');
    expect(progression.acknowledgedWin).toBe(true);
  });

  it('acknowledgeWin does not reset objectives', () => {
    const store = useGameStore.getState();
    const mockState = createFreshState('test-seed');
    store.loadGame('test-slot', mockState);

    useGameStore.setState((s) => ({
      progression: {
        ...s.progression,
        status: 'won',
        objectives: s.progression.objectives.map((o, i) =>
          i === 0 ? { ...o, completed: true, completedWeek: 5, completedYear: 1 } : o
        ),
      },
    }));

    useGameStore.getState().acknowledgeWin();

    const progression = useGameStore.getState().progression;
    expect(progression.objectives[0]!.completed).toBe(true);
    expect(progression.objectives[0]!.completedWeek).toBe(5);
  });
});
