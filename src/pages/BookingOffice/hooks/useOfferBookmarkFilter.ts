import { useState } from 'react';
import { useGameStore, useBookmarks } from '@/state/useGameStore';
import type { BoutOffer } from '@/types/state.types';

/** Bookmarked-only toggle + filtered offer lists for the office viewport. */
export function useOfferBookmarkFilter(thisWeekOffers: BoutOffer[], upcomingOffers: BoutOffer[]) {
  const isBookmarked = useGameStore((s) => s.isBookmarked);
  useBookmarks(); // trigger re-render on bookmark changes
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const filter = (offers: BoutOffer[]) =>
    showBookmarkedOnly ? offers.filter((o) => isBookmarked('boutOffer', o.id)) : offers;

  const bookmarkedCount =
    thisWeekOffers.filter((o) => isBookmarked('boutOffer', o.id)).length +
    upcomingOffers.filter((o) => isBookmarked('boutOffer', o.id)).length;

  return {
    showBookmarkedOnly,
    toggleBookmarked: () => setShowBookmarkedOnly((v) => !v),
    filteredThisWeek: filter(thisWeekOffers),
    filteredUpcoming: filter(upcomingOffers),
    bookmarkedCount,
  };
}
