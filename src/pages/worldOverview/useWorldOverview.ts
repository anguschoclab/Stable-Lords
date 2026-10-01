import { useState, useMemo } from 'react';
import { useWorldState, useBookmarks } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { getStableTemplates } from '@/engine/rivals';
import type { StableRow, WarriorRow } from '@/types/leaderboard';
import {
  buildStableRows,
  buildWarriorRows,
  type StableSortField,
  type WarriorSortField,
} from './rows';

type Sort<F extends string> = { field: F; dir: 'asc' | 'desc' };

/**
 * World Overview state: rankings rows, sort toggles, bookmark filtering.
 */
export function useWorldOverview(showBookmarkedOnly: boolean) {
  const state = useWorldState();
  const bookmarks = useBookmarks();
  const [stableSort, setStableSort] = useState<Sort<StableSortField>>({
    field: 'fame',
    dir: 'desc',
  });
  const [warriorSort, setWarriorSort] = useState<Sort<WarriorSortField>>({
    field: 'fame',
    dir: 'desc',
  });

  const templates = useMemo(() => getStableTemplates(), []);

  const stableRows = useMemo<StableRow[]>(
    () => buildStableRows(state, stableSort, templates),
    [state, stableSort, templates]
  );

  const bookmarkIds = useMemo(() => bookmarkIdsByType(bookmarks), [bookmarks]);

  const filteredStableRows = useMemo(() => {
    if (!showBookmarkedOnly) return stableRows;
    const ids = bookmarkIds.get('rival');
    return stableRows.filter((r) => ids?.has(r.id));
  }, [stableRows, showBookmarkedOnly, bookmarkIds]);

  const stableBookmarkedCount = stableRows.filter((r) =>
    bookmarkIds.get('rival')?.has(r.id)
  ).length;

  const warriorRows = useMemo<WarriorRow[]>(
    () => buildWarriorRows(state, warriorSort),
    [state, warriorSort]
  );

  const filteredWarriorRows = useMemo(() => {
    if (!showBookmarkedOnly) return warriorRows;
    const ids = bookmarkIds.get('warrior');
    return warriorRows.filter((r) => ids?.has(r.id));
  }, [warriorRows, showBookmarkedOnly, bookmarkIds]);

  const warriorBookmarkedCount = warriorRows.filter((r) =>
    bookmarkIds.get('warrior')?.has(r.id)
  ).length;

  const totalWarriors = stableRows.reduce((s, r) => s + r.roster, 0);
  const totalKills = stableRows.reduce((s, r) => s + (r.kills || 0), 0);
  const topStable = stableRows[0]?.name ?? '—';
  const topStableId = stableRows[0]?.id ?? null;

  const toggleStableSort = (field: string) =>
    setStableSort((prev) => ({
      field: field as StableSortField,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
    }));

  const toggleWarriorSort = (field: string) =>
    setWarriorSort((prev) => ({
      field: field as WarriorSortField,
      dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
    }));

  return {
    state,
    stableSort,
    warriorSort,
    filteredStableRows,
    stableBookmarkedCount,
    filteredWarriorRows,
    warriorBookmarkedCount,
    totalWarriors,
    totalKills,
    topStable,
    topStableId,
    totalStables: stableRows.length,
    toggleStableSort,
    toggleWarriorSort,
  };
}
