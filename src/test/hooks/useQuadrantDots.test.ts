// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useQuadrantDots } from '@/hooks/useQuadrantDots';
import type { GameState, RivalStableData } from '@/types/state.types';
import * as stableReputation from '@/engine/stableReputation';
import type { StableReputationInput } from '@/engine/stableReputation';

beforeEach(() => {
  vi.spyOn(stableReputation, 'computeStableReputation').mockImplementation((state: StableReputationInput) => ({
    fame: state.fame ?? 0,
    notoriety: 50,
    honor: 50,
    adaptability: 0,
  }));
  vi.spyOn(stableReputation, 'computeRivalReputation').mockImplementation((roster: unknown[]) => ({
    fame: (roster as unknown[]).length * 10,
    notoriety: (roster as unknown[]).length * 5,
    honor: 50,
    adaptability: 0,
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: { stableName: 'Player Stable' },
    roster: [],
    graveyard: [],
    newsletter: [],
    arenaHistory: [],
    fame: 42,
    trainingAssignments: [],
    trainers: [],
    ...overrides,
  } as any as GameState;
}

function createMockRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1',
    owner: { stableName: 'Rival Stable' } as any as RivalStableData['owner'],
    roster: [{}, {}] as any as RivalStableData['roster'],
    treasury: 0,
    ...overrides,
  } as any as RivalStableData;
}

describe('useQuadrantDots', () => {
  it('returns player dot with isPlayer true', () => {
    const state = createMockGameState();
    const { result } = renderHook(() => useQuadrantDots(state, []));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      label: 'Player Stable',
      fame: 42,
      notoriety: 50,
      isPlayer: true,
    });
  });

  it('returns rival dots with isPlayer false', () => {
    const state = createMockGameState();
    const rivals = [
      createMockRival(),
      createMockRival({
        owner: { stableName: 'Another Rival' } as any as RivalStableData['owner'],
      }),
    ];
    const { result } = renderHook(() => useQuadrantDots(state, rivals));

    expect(result.current).toHaveLength(3);
    expect(result.current[0]!.isPlayer).toBe(true);
    expect(result.current[1]!.isPlayer).toBe(false);
    expect(result.current[2]!.isPlayer).toBe(false);
    expect(result.current[1]!.label).toBe('Rival Stable');
    expect(result.current[2]!.label).toBe('Another Rival');
  });

  it('computes fame/notoriety via engine functions', () => {
    const state = createMockGameState({ fame: 99 });
    const rivals = [createMockRival({ roster: [{}, {}, {}] as any as RivalStableData['roster'] })];
    const { result } = renderHook(() => useQuadrantDots(state, rivals));

    expect(result.current[0]!.fame).toBe(99);
    expect(result.current[1]!.fame).toBe(30); // 3 roster items * 10
    expect(result.current[1]!.notoriety).toBe(15); // 3 roster items * 5
  });

  it('handles empty rivals array', () => {
    const state = createMockGameState();
    const { result } = renderHook(() => useQuadrantDots(state, []));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]!.isPlayer).toBe(true);
  });

  it('memoizes result for same inputs', () => {
    const state = createMockGameState();
    const rivals = [createMockRival()];
    const { result, rerender } = renderHook(({ state, rivals }) => useQuadrantDots(state, rivals), {
      initialProps: { state, rivals },
    });

    const first = result.current;
    rerender({ state, rivals });
    expect(result.current).toBe(first);
  });
});
