// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderHook } from '@testing-library/react';

import {
  useReputationState,
  useArenaPreferences,
  useBookmarks,
  useWarriorNameState,
} from '@/state/selectors';

import { useGameStore } from '@/state/useGameStore';

describe('selectors', () => {
  const mockState = {
    player: { id: 'p1', stableName: 'Test Stable' },
    roster: [
      { id: 'w1', name: 'Warrior 1', style: 'Gladiator', career: { wins: 5, losses: 0 } },
      { id: 'w2', name: 'Warrior 2', style: 'Retiarius', career: { wins: 2, losses: 2 } },
      { id: 'w3', name: 'Warrior 3', style: 'Gladiator', career: { wins: 0, losses: 5 } },
    ],
    rivals: [{ id: 'r1', name: 'Rival Stable' }],
    treasury: 1500,
    week: 12,
    isSimulating: true,
    graveyard: [],
    arenaHistory: [],
    newsletter: [],
    fame: 100,
    trainingAssignments: [],
    trainers: [],
    arenaPreferences: { bgm: true },
    bookmarks: ['w1', 'r1'],
    retired: [],
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState(mockState);
  });

  it('useReputationState returns correct sub-state', () => {
    const { result } = renderHook(() => useReputationState());
    expect(result.current).toEqual({
      roster: mockState.roster,
      graveyard: mockState.graveyard,
      arenaHistory: mockState.arenaHistory,
      newsletter: mockState.newsletter,
      player: mockState.player,
      fame: mockState.fame,
      trainingAssignments: mockState.trainingAssignments,
      trainers: mockState.trainers,
    });
  });

  it('useArenaPreferences returns arenaPreferences', () => {
    const { result } = renderHook(() => useArenaPreferences());
    expect(result.current).toEqual(mockState.arenaPreferences);
  });

  it('useBookmarks returns bookmarks', () => {
    const { result } = renderHook(() => useBookmarks());
    expect(result.current).toEqual(mockState.bookmarks);
  });

  it('useWarriorNameState returns correct sub-state', () => {
    const { result } = renderHook(() => useWarriorNameState());
    expect(result.current).toEqual({
      player: mockState.player,
      roster: mockState.roster,
      graveyard: mockState.graveyard,
      retired: mockState.retired,
      rivals: mockState.rivals,
    });
  });
});
