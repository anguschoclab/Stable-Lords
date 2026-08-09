import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createTournamentSlice, TournamentSlice } from '@/state/slices/tournamentSlice';
import { act } from '@testing-library/react';
import type { TournamentEntry } from '@/types/state.types';

const createTestStore = () =>
  create<TournamentSlice>()(
    immer((set, get, api) => createTournamentSlice(set as any, get as any, api as any)) as any
  ) as any;

describe('TournamentSlice', () => {
  let useTestStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    useTestStore = createTestStore();
  });

  it('should initialize with default values', () => {
    const { tournaments, isTournamentWeek, activeTournamentId } = useTestStore.getState();
    expect(tournaments).toEqual([]);
    expect(isTournamentWeek).toBe(false);
    expect(activeTournamentId).toBeUndefined();
  });

  it('should set tournaments', () => {
    const tournaments: TournamentEntry[] = [
      {
        id: 't1' as import('@/types/shared.types').TournamentId,
        week: 10,
        participants: [],
        season: 'Spring',
        tierId: 'Amateur',
        name: 'Mock',
        bracket: [],
        completed: false,
      } as any,
    ];

    act(() => {
      useTestStore.getState().setTournaments(tournaments);
    });

    expect(useTestStore.getState().tournaments).toEqual(tournaments);
  });

  it('should set tournament week', () => {
    act(() => {
      useTestStore.getState().setTournamentWeek(true);
    });
    expect(useTestStore.getState().isTournamentWeek).toBe(true);

    act(() => {
      useTestStore.getState().setTournamentWeek(false);
    });
    expect(useTestStore.getState().isTournamentWeek).toBe(false);
  });

  it('should set active tournament', () => {
    act(() => {
      useTestStore
        .getState()
        .setActiveTournament('t1' as import('@/types/shared.types').TournamentId);
    });
    expect(useTestStore.getState().activeTournamentId).toBe('t1');

    act(() => {
      useTestStore.getState().setActiveTournament(undefined);
    });
    expect(useTestStore.getState().activeTournamentId).toBeUndefined();
  });
});
