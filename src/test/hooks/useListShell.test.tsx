/**
 * useListShell — the shared search/sort/window contract every rival-scale
 * list (90–160 stables) depends on.
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListShell } from '@/hooks/useListShell';

interface Row {
  name: string;
  wins: number;
}

const sorts = [
  { id: 'name', label: 'Name', compare: (a: Row, b: Row) => a.name.localeCompare(b.name) },
  { id: 'wins', label: 'Wins', compare: (a: Row, b: Row) => b.wins - a.wins },
];

const rows: Row[] = [
  { name: 'Ash Reapers', wins: 10 },
  { name: 'Steel Serpents', wins: 30 },
  { name: 'Golden Lions', wins: 20 },
];

describe('useListShell', () => {
  it('returns all items sorted by the default sort', () => {
    const { result } = renderHook(() => useListShell(rows, { searchText: (r) => [r.name], sorts }));
    expect(result.current.filtered.map((r) => r.name)).toEqual([
      'Ash Reapers',
      'Golden Lions',
      'Steel Serpents',
    ]);
    expect(result.current.total).toBe(3);
  });

  it('filters by lowercase substring across the search surface', () => {
    const { result } = renderHook(() =>
      useListShell(rows, {
        searchText: (r) => [r.name],
        sorts,
      })
    );
    act(() => result.current.setQuery('steel'));
    expect(result.current.visible.map((r) => r.name)).toEqual(['Steel Serpents']);
  });

  it('re-sorts when the sort id changes', () => {
    const { result } = renderHook(() =>
      useListShell(rows, { searchText: (r) => [r.name], sorts, defaultSortId: 'wins' })
    );
    expect(result.current.visible[0]!.wins).toBe(30);
    act(() => result.current.setSortId('name'));
    expect(result.current.visible[0]!.name).toBe('Ash Reapers');
  });

  it('windows the list at pageSize until showAll is set', () => {
    const many: Row[] = Array.from({ length: 60 }, (_, i) => ({
      name: `Stable ${String(i).padStart(3, '0')}`,
      wins: i,
    }));
    const { result } = renderHook(() =>
      useListShell(many, { searchText: (r) => [r.name], sorts, pageSize: 25 })
    );
    expect(result.current.visible.length).toBe(25);
    expect(result.current.filtered.length).toBe(60);
    act(() => result.current.setShowAll(true));
    expect(result.current.visible.length).toBe(60);
  });

  it('keeps search + window composed — search narrows the windowed source', () => {
    const many: Row[] = Array.from({ length: 60 }, (_, i) => ({
      name: i < 30 ? `Iron ${i}` : `Ash ${i}`,
      wins: i,
    }));
    const { result } = renderHook(() =>
      useListShell(many, { searchText: (r) => [r.name], sorts, pageSize: 10 })
    );
    act(() => result.current.setQuery('ash'));
    expect(result.current.filtered.length).toBe(30);
    expect(result.current.visible.length).toBe(10);
  });
});
