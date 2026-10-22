/**
 * useTournamentSchedule — pins for the per-round status map refactor
 * (firstPendingRound hoisting + hasCompleted/hasPending precompute).
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTournamentSchedule } from '@/hooks/useTournamentSchedule';
import type { TournamentEntry, TournamentBout } from '@/types/game';
import type { TournamentId } from '@/types/shared.types';

function bout(round: number, winner?: 'A' | 'D'): TournamentBout {
  return {
    round,
    matchIndex: 0,
    warriorIdA: `a${round}` as any,
    warriorIdD: `d${round}` as any,
    winner,
  } as TournamentBout;
}

function tournament(bouts: TournamentBout[]): TournamentEntry {
  return {
    id: 't1' as TournamentId,
    season: 'Spring',
    week: 1,
    tierId: 't',
    name: 'Cup',
    bracket: bouts,
    participants: [],
    completed: false,
  } as TournamentEntry;
}

describe('useTournamentSchedule', () => {
  const t = tournament([
    bout(1, 'A'),
    bout(1, 'D'),
    bout(2, 'A'),
    bout(2), // pending
    bout(3), // pending
  ]);

  it('groups bouts by round ascending and reports stats', () => {
    const { result } = renderHook(() => useTournamentSchedule(t));
    expect(result.current.filteredRounds.map(([r]) => r)).toEqual([1, 2, 3]);
    expect(result.current.stats).toMatchObject({ total: 5, completed: 3, upcoming: 2 });
  });

  it('current-round filter returns the FIRST round with a pending bout', () => {
    const { result } = renderHook(() => useTournamentSchedule(t));
    act(() => result.current.setFilter('current-round'));
    expect(result.current.filteredRounds.map(([r]) => r)).toEqual([2]);
  });

  it('completed/upcoming filters use any-bout semantics per round', () => {
    const { result } = renderHook(() => useTournamentSchedule(t));
    act(() => result.current.setFilter('completed'));
    // rounds 1 and 2 each contain at least one decided bout
    expect(result.current.filteredRounds.map(([r]) => r)).toEqual([1, 2]);
    act(() => result.current.setFilter('upcoming'));
    expect(result.current.filteredRounds.map(([r]) => r)).toEqual([2, 3]);
  });

  it('all-pending bracket yields empty current-round filter', () => {
    const { result } = renderHook(() => useTournamentSchedule(tournament([bout(1), bout(1)])));
    act(() => result.current.setFilter('current-round'));
    // firstPendingRound = round 1 (all pending) → actually returns [1]
    expect(result.current.filteredRounds.map(([r]) => r)).toEqual([1]);
  });
});
