import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';

/** Derived directory state: sorted list, aggregate stats, bookmark count. */
export function usePromoterDirectory(showBookmarkedOnly: boolean) {
  const { promoters, boutOffers, week, absoluteWeek, bookmarks } = useGameStore(
    useShallow((s) => ({
      promoters: s.promoters,
      boutOffers: s.boutOffers,
      week: s.week,
      absoluteWeek: s.absoluteWeek,
      bookmarks: s.bookmarks,
    }))
  );

  const { sortedPromoters, stats, bookmarkedCount } = useMemo(() => {
    const allPromoters = Object.values(promoters || {});
    const promoterBookmarkIds = bookmarkIdsByType(bookmarks).get('promoter');
    const bookmarked = allPromoters.filter((p) => promoterBookmarkIds?.has(p.id));
    const list = showBookmarkedOnly ? bookmarked : allPromoters;

    // Sort by tier (Legendary first) then by legacy fame
    const sorted = list.sort((a, b) => {
      const tierOrder = { Legendary: 4, National: 3, Regional: 2, Local: 1 };
      const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
      if (tierDiff !== 0) return tierDiff;
      return (b.history?.legacyFame || 0) - (a.history?.legacyFame || 0);
    });

    // Calculate aggregate stats
    const totalPurse = allPromoters.reduce((sum, p) => sum + (p.history?.totalPursePaid || 0), 0);
    const totalNotableBouts = allPromoters.reduce(
      (sum, p) => sum + (p.history?.notableBouts?.length || 0),
      0
    );
    const totalCapacity = allPromoters.reduce((sum, p) => sum + p.capacity, 0);
    const totalActiveOffers = Object.values(boutOffers || {}).filter(
      (o) => o.status === 'Signed'
    ).length;

    return {
      sortedPromoters: sorted,
      stats: {
        totalPromoters: allPromoters.length,
        totalPurse,
        totalNotableBouts,
        totalCapacity,
        totalActiveOffers,
      },
      bookmarkedCount: bookmarked.length,
    };
  }, [promoters, boutOffers, showBookmarkedOnly, bookmarks]);

  return { boutOffers, week, absoluteWeek, sortedPromoters, stats, bookmarkedCount };
}
