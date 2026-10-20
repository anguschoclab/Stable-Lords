import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { Surface } from '@/components/ui/Surface';
import { useActiveRoster } from '@/hooks/useActiveRoster';
import { useListShell } from '@/hooks/useListShell';
import { ListToolbar } from '@/components/ui/ListToolbar';
import { warriorSearchText, WARRIOR_SORTS } from '@/components/warrior/warriorListUtils';
import { useBookmarks, useGameStore } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import type { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import { WallHeader, RosterRows, buildContenderBadges } from './rosterWall/sections';

/** Derived wall state: contender badges, list shell, bookmark filter, styles. */
function useRosterWallData(showBookmarkedOnly: boolean) {
  const sortedRoster = useActiveRoster();
  const bookmarks = useBookmarks();

  const crownState = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      rivals: s.rivals,
      arenaChampions: s.arenaChampions,
      absoluteWeek: s.absoluteWeek,
    }))
  );

  const contenderBadges = useMemo(
    () => buildContenderBadges(crownState as GameState),
    [crownState]
  );

  const list = useListShell(sortedRoster, {
    searchText: warriorSearchText,
    sorts: WARRIOR_SORTS,
    defaultSortId: 'fame',
    pageSize: 25,
  });

  const filteredRoster = useMemo(() => {
    if (!showBookmarkedOnly) return list.visible;
    const ids = bookmarkIdsByType(bookmarks).get('warrior');
    return list.visible.filter((w) => ids?.has(w.id));
  }, [list.visible, showBookmarkedOnly, bookmarks]);

  const rosterStyles = useMemo(
    () => sortedRoster.map((w) => w.style as FightingStyle),
    [sortedRoster]
  );

  return { sortedRoster, contenderBadges, list, filteredRoster, rosterStyles };
}

/** The player roster wall — searchable, sortable, bookmark-filterable. */
export function RosterWall() {
  const navigate = useNavigate();
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const { sortedRoster, contenderBadges, list, filteredRoster, rosterStyles } =
    useRosterWallData(showBookmarkedOnly);

  return (
    <Surface variant="glass" padding="none" className="border-border/10 relative shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-arena-gold/40 to-primary/40 opacity-30" />

      <WallHeader
        rosterSize={sortedRoster.length}
        rosterStyles={rosterStyles}
        showBookmarkedOnly={showBookmarkedOnly}
        onToggleBookmarked={() => setShowBookmarkedOnly((v) => !v)}
      />

      {sortedRoster.length > 0 && (
        <div className="px-8 pt-6">
          <ListToolbar
            list={list}
            sorts={WARRIOR_SORTS}
            placeholder="Search roster…"
            ariaLabel="Filter roster"
          />
        </div>
      )}

      <div className="p-8">
        <RosterRows
          warriors={filteredRoster}
          contenderBadges={contenderBadges}
          onSelect={(id) => navigate({ to: '/warrior/$id', params: { id } })}
        />
      </div>
    </Surface>
  );
}
