import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useGameStore, useBookmarks } from '@/state/useGameStore';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { useBookingOffice } from './hooks/useBookingOffice';
import { AssetRegistry } from './components/AssetRegistry';
import { HeaderStats, RosterStatusBar, OfferTabs } from './sections';

/**
 *
 */
export default function BookingOffice() {
  const {
    week,
    promoters,
    roster,
    boutOffers,
    activeTab,
    setActiveTab,
    signedOfferIds,
    selectedWarriorId,
    setSelectedWarriorId,
    rivalWarriorMap,
    thisWeekOffers,
    upcomingOffers,
    idleWarriors,
    highestPurse,
    handleResponse,
    acceptAllHonorable,
  } = useBookingOffice();
  const { cards } = useStableAdvisor();
  const advisorCardMap = useMemo(() => {
    const map = new Map<string, (typeof cards)[0]>();
    for (const c of cards) {
      map.set(c.warriorId, c);
    }
    return map;
  }, [cards]);

  const isBookmarked = useGameStore((s) => s.isBookmarked);
  useBookmarks(); // trigger re-render on bookmark changes
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const filteredThisWeek = showBookmarkedOnly
    ? thisWeekOffers.filter((o) => isBookmarked('boutOffer', o.id))
    : thisWeekOffers;
  const filteredUpcoming = showBookmarkedOnly
    ? upcomingOffers.filter((o) => isBookmarked('boutOffer', o.id))
    : upcomingOffers;

  const bookmarkedCount =
    thisWeekOffers.filter((o) => isBookmarked('boutOffer', o.id)).length +
    upcomingOffers.filter((o) => isBookmarked('boutOffer', o.id)).length;

  return (
    <PageFrame>
      <PageHeader
        title="Bout Offers"
        subtitle={`ARENA · FIGHT OFFERS · WK ${week}`}
        actions={
          <HeaderStats
            openOfferCount={thisWeekOffers.length + upcomingOffers.length}
            highestPurse={highestPurse}
          />
        }
      />

      <RosterStatusBar
        idleCount={idleWarriors.length}
        rosterSize={roster.length}
        onAcceptAll={acceptAllHonorable}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Rail Asset Registry */}
        <aside className="space-y-8">
          <SectionDivider label="Warrior Roster" />
          <AssetRegistry
            roster={roster}
            boutOffers={boutOffers}
            selectedWarriorId={selectedWarriorId}
            onSelect={setSelectedWarriorId}
          />
        </aside>

        {/* Right Rail Viewport */}
        <div className="lg:col-span-3 space-y-8">
          <OfferTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            thisWeekOffers={filteredThisWeek}
            upcomingOffers={filteredUpcoming}
            showBookmarkedOnly={showBookmarkedOnly}
            onToggleBookmarked={() => setShowBookmarkedOnly((v) => !v)}
            bookmarkedCount={bookmarkedCount}
            roster={roster}
            promoters={promoters}
            rivalWarriorMap={rivalWarriorMap}
            signedOfferIds={signedOfferIds}
            advisorCardMap={advisorCardMap}
            onResponse={handleResponse}
          />
        </div>
      </div>
    </PageFrame>
  );
}
