// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWarriorLeaderboard } from '@/hooks/useWarriorLeaderboard';
import type { WarriorRow } from '@/types/leaderboard';

function makeRows(): WarriorRow[] {
  return [
    {
      id: 'w1',
      name: 'A',
      stableName: 'S1',
      stableId: 's1',
      fame: 100,
      wins: 10,
      losses: 2,
      kills: 5,
      winRate: 83,
      style: 'Brawler',
      isPlayer: true,
      officialRank: 1,
      compositeScore: 90,
    },
    {
      id: 'w2',
      name: 'B',
      stableName: 'S2',
      stableId: 's2',
      fame: 200,
      wins: 20,
      losses: 5,
      kills: 15,
      winRate: 80,
      style: 'Technician',
      isPlayer: false,
      officialRank: 2,
      compositeScore: 85,
    },
    {
      id: 'w3',
      name: 'C',
      stableName: 'S1',
      stableId: 's1',
      fame: 50,
      wins: 5,
      losses: 10,
      kills: 2,
      winRate: 33,
      style: 'Brawler',
      isPlayer: true,
      officialRank: 3,
      compositeScore: 40,
    },
  ];
}

describe('useWarriorLeaderboard', () => {
  it('returns all rows by default', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    expect(result.current.filtered).toEqual(rows);
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.classes).toEqual(['Brawler', 'Technician']);
  });

  it('filters by myWarriorsOnly', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setMyWarriorsOnly(true);
    });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered.every((r) => r.isPlayer)).toBe(true);
    expect(result.current.isFiltered).toBe(true);
  });

  it('filters by class', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setClassFilter('Technician');
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]!.style).toBe('Technician');
  });

  it('sorts by kills via quickFilter', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setQuickFilter('kills');
    });
    expect(result.current.filtered[0]!.kills).toBe(15);
    expect(result.current.filtered[1]!.kills).toBe(5);
    expect(result.current.filtered[2]!.kills).toBe(2);
  });

  it('sorts by wins via quickFilter', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setQuickFilter('wins');
    });
    expect(result.current.filtered[0]!.wins).toBe(20);
    expect(result.current.filtered[1]!.wins).toBe(10);
    expect(result.current.filtered[2]!.wins).toBe(5);
  });

  it('sorts by winRate via quickFilter', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setQuickFilter('winRate');
    });
    expect(result.current.filtered[0]!.winRate).toBe(83);
    expect(result.current.filtered[1]!.winRate).toBe(80);
    expect(result.current.filtered[2]!.winRate).toBe(33);
  });

  it('combines class and quickFilter', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setClassFilter('Brawler');
      result.current.setQuickFilter('kills');
    });
    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered[0]!.kills).toBe(5);
    expect(result.current.filtered[1]!.kills).toBe(2);
  });

  it('clearFilters resets all state', () => {
    const rows = makeRows();
    const { result } = renderHook(() => useWarriorLeaderboard(rows));
    act(() => {
      result.current.setMyWarriorsOnly(true);
      result.current.setClassFilter('Brawler');
      result.current.setQuickFilter('wins');
    });
    expect(result.current.isFiltered).toBe(true);
    act(() => {
      result.current.clearFilters();
    });
    expect(result.current.filtered).toEqual(rows);
    expect(result.current.isFiltered).toBe(false);
    expect(result.current.myWarriorsOnly).toBe(false);
    expect(result.current.classFilter).toBeNull();
    expect(result.current.quickFilter).toBeNull();
  });
});
