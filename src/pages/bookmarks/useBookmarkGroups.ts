import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useNavigate } from '@tanstack/react-router';
import { groupBookmarks } from './groupBookmarks';

/**
 * Store subscription for the Bookmarks page: every entity collection
 * bookmarks can reference, grouped rows, and the clear actions.
 */
export function useBookmarkGroups() {
  const navigate = useNavigate();

  const {
    bookmarks,
    roster,
    graveyard,
    retired,
    rivals,
    promoters,
    trainers,
    tournaments,
    boutOffers,
    scoutReports,
    clearBookmarks,
    clearBookmarksByType,
  } = useGameStore(
    useShallow((s) => ({
      bookmarks: s.bookmarks,
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      promoters: s.promoters,
      trainers: s.trainers,
      tournaments: s.tournaments,
      boutOffers: s.boutOffers,
      scoutReports: s.scoutReports,
      clearBookmarks: s.clearBookmarks,
      clearBookmarksByType: s.clearBookmarksByType,
    }))
  );

  const grouped = useMemo(
    () =>
      groupBookmarks(
        {
          bookmarks,
          roster,
          graveyard,
          retired,
          rivals,
          promoters,
          trainers,
          tournaments,
          boutOffers,
          scoutReports,
        },
        navigate
      ),
    [
      bookmarks,
      roster,
      graveyard,
      retired,
      rivals,
      promoters,
      trainers,
      tournaments,
      boutOffers,
      scoutReports,
      navigate,
    ]
  );

  return { bookmarks, grouped, clearBookmarks, clearBookmarksByType };
}
