import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { isActive } from '@/engine/warrior/warriorStatus';

export const SEASON_NAMES: Record<string, string> = {
  Spring: 'Spring Classic',
  Summer: 'Summer Cup',
  Fall: 'Fall Clash',
  Winter: 'Winter Crown',
};

export const SEASON_ICONS: Record<string, string> = {
  Spring: '🌿',
  Summer: '☀️',
  Fall: '🍂',
  Winter: '❄️',
};

/**
 * Store selection + derived tournament state for the Tournaments page.
 */
/** Raw store slice the tournaments page reads. */
function useTournamentStoreSlice() {
  return useGameStore(
    useShallow((s) => ({
      tournaments: s.tournaments,
      season: s.season,
      activeTournamentId: s.activeTournamentId,
      roster: s.roster,
      week: s.week,
      year: s.year,
      arenaHistory: s.arenaHistory,
      player: s.player,
      activeSlotId: s.activeSlotId,
      loadGame: s.loadGame,
      setSimulating: s.setSimulating,
      isSimulating: s.isSimulating,
      bookmarks: s.bookmarks,
    }))
  );
}

/** Tournaments page state: store slice, derived lists, and actions. */
export function useTournamentState(showBookmarkedOnly: boolean) {
  const {
    tournaments,
    season,
    roster,
    week,
    year,
    arenaHistory,
    player,
    activeSlotId,
    loadGame,
    setSimulating,
    isSimulating,
    bookmarks,
    activeTournamentId,
  } = useTournamentStoreSlice();

  // The active tournament is whichever the engine marked live this week.
  // Leftover tiers from previous years share season/week, so a bare
  // `!completed` match would resurrect a stale bracket — scope by id first.
  const currentTournament = useMemo(
    () =>
      tournaments.find((t) => t.id === activeTournamentId) ??
      tournaments.find((t) => t.week === week && !t.completed),
    [tournaments, activeTournamentId, week]
  );

  const activeWarriors = useMemo(() => roster.filter((w) => isActive(w)), [roster]);

  // Warriors belonging to the player that are in the active tournament
  const playerWarriorsInTournament = useMemo(() => {
    if (!currentTournament || !player) return [];
    return currentTournament.participants.filter((w) => w.stableId === player.id);
  }, [currentTournament, player]);

  const allPastTournaments = useMemo(
    () => tournaments.filter((t) => t.completed).reverse(),
    [tournaments]
  );
  const bookmarkIds = useMemo(() => bookmarkIdsByType(bookmarks), [bookmarks]);
  const pastTournaments = useMemo(() => {
    if (!showBookmarkedOnly) return allPastTournaments;
    const ids = bookmarkIds.get('tournament');
    return allPastTournaments.filter((t) => ids?.has(t.id));
  }, [allPastTournaments, showBookmarkedOnly, bookmarkIds]);

  const bookmarkedCount = allPastTournaments.filter(
    (t) => bookmarkIds.get('tournament')?.has(t.id)
  ).length;

  // 🌩️ Protocol Sync: Auto-open prep dialog if tournament is ready but not started
  const isTournamentReadyToStart = useMemo(() => {
    if (!currentTournament) return false;
    return currentTournament.bracket.every((b) => b.winner === undefined);
  }, [currentTournament]);

  return {
    tournaments,
    season,
    roster,
    week,
    year,
    arenaHistory,
    player,
    activeSlotId,
    loadGame,
    setSimulating,
    isSimulating,
    currentTournament,
    activeWarriors,
    playerWarriorsInTournament,
    pastTournaments,
    bookmarkedCount,
    isTournamentReadyToStart,
  };
}
