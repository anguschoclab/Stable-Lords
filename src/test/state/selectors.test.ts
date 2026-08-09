import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderHook } from '@testing-library/react';

import {
  usePlayer,
  useRoster,
  useRivals,
  useTreasury,
  useWeek,
  useIsSimulating,
  useReputationState,
  useArenaPreferences,
  useBookmarks,
  useWarriorNameState,
  useStyleStats,
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

  it('usePlayer returns player state', () => {
    const { result } = renderHook(() => usePlayer());
    expect(result.current).toEqual(mockState.player);
  });

  it('useRoster returns roster', () => {
    const { result } = renderHook(() => useRoster());
    expect(result.current).toEqual(mockState.roster);
  });

  it('useRivals returns rivals', () => {
    const { result } = renderHook(() => useRivals());
    expect(result.current).toEqual(mockState.rivals);
  });

  it('useTreasury returns treasury', () => {
    const { result } = renderHook(() => useTreasury());
    expect(result.current).toEqual(mockState.treasury);
  });

  it('useWeek returns week', () => {
    const { result } = renderHook(() => useWeek());
    expect(result.current).toEqual(mockState.week);
  });

  it('useIsSimulating returns isSimulating', () => {
    const { result } = renderHook(() => useIsSimulating());
    expect(result.current).toEqual(mockState.isSimulating);
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

  it('useStyleStats correctly aggregates and sorts style stats', () => {
    const { result } = renderHook(() => useStyleStats());

    // Gladiator: wins = 5+0 = 5, losses = 0+5 = 5. total = 10, winRate = 0.5
    // Retiarius: wins = 2, losses = 2. total = 4, winRate = 0.5

    expect(result.current.length).toBe(2);
    // Since winRate is the same, order depends on Array.from(Map) iteration order which is insertion order
    // "Gladiator" is inserted first
    expect(result.current).toContainEqual({ style: 'Gladiator', wins: 5, losses: 5, winRate: 0.5 });
    expect(result.current).toContainEqual({ style: 'Retiarius', wins: 2, losses: 2, winRate: 0.5 });
  });

  it('useStyleStats handles warriors with no career safely', () => {
    useGameStore.setState({
      ...mockState,
      roster: [{ id: 'w4', name: 'Warrior 4', style: 'Dimachaerus', career: undefined as any }],
    });

    const { result } = renderHook(() => useStyleStats());
    expect(result.current.length).toBe(1);
    expect(result.current[0]).toEqual({ style: 'Dimachaerus', wins: 0, losses: 0, winRate: 0 });
  });
});
