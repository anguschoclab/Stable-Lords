// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useQuadrantDots } from '@/hooks/useQuadrantDots';
import type { GameState, RivalStableData } from '@/types/state.types';

vi.mock('@/engine/stableReputation', () => ({
  computeStableReputation: vi.fn((state: GameState) => ({
    fame: state.fame ?? 0,
    notoriety: 50,
    honor: 50,
    adaptability: 0,
  })),
  computeRivalReputation: vi.fn((roster: unknown[]) => ({
    fame: roster.length * 10,
    notoriety: roster.length * 5,
    honor: 50,
    adaptability: 0,
  })),
}));

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
  } as unknown as GameState;
}

function createMockRival(overrides: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'rival-1',
    owner: { stableName: 'Rival Stable' } as unknown as RivalStableData['owner'],
    roster: [{}, {}] as unknown as RivalStableData['roster'],
    treasury: 0,
    ...overrides,
  } as unknown as RivalStableData;
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
        owner: { stableName: 'Another Rival' } as unknown as RivalStableData['owner'],
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
    const rivals = [
      createMockRival({ roster: [{}, {}, {}] as unknown as RivalStableData['roster'] }),
    ];
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
