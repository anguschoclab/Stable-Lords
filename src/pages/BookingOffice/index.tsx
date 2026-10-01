import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { useBookingOffice } from './hooks/useBookingOffice';
import { useOfferBookmarkFilter } from './hooks/useOfferBookmarkFilter';
import { AssetRegistry } from './components/AssetRegistry';
import { HeaderStats, RosterStatusBar, OfferTabs } from './sections';

/**
 *
 */
export default function BookingOffice() {
  const office = useBookingOffice();
  const {
    week,
    roster,
    boutOffers,
    activeTab,
    setActiveTab,
    selectedWarriorId,
    setSelectedWarriorId,
    thisWeekOffers,
    upcomingOffers,
    idleWarriors,
    highestPurse,
    acceptAllHonorable,
  } = office;
  const { cards } = useStableAdvisor();
  const advisorCardMap = useMemo(() => {
    const map = new Map<string, (typeof cards)[0]>();
    for (const c of cards) {
      map.set(c.warriorId, c);
    }
    return map;
  }, [cards]);

  const {
    showBookmarkedOnly,
    toggleBookmarked,
    filteredThisWeek,
    filteredUpcoming,
    bookmarkedCount,
  } = useOfferBookmarkFilter(thisWeekOffers, upcomingOffers);

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
          <OffersViewport
            office={office}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filter={{
              showBookmarkedOnly,
              toggleBookmarked,
              filteredThisWeek,
              filteredUpcoming,
              bookmarkedCount,
            }}
            advisorCardMap={advisorCardMap}
          />
        </div>
      </div>
    </PageFrame>
  );
}

/** Right rail: the tabbed offer lists wired to the office + bookmark state. */
function OffersViewport({
  office,
  activeTab,
  setActiveTab,
  filter,
  advisorCardMap,
}: {
  office: ReturnType<typeof useBookingOffice>;
  activeTab: ReturnType<typeof useBookingOffice>['activeTab'];
  setActiveTab: ReturnType<typeof useBookingOffice>['setActiveTab'];
  filter: ReturnType<typeof useOfferBookmarkFilter>;
  advisorCardMap: Map<string, ReturnType<typeof useStableAdvisor>['cards'][number]>;
}) {
  return (
    <OfferTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
      thisWeekOffers={filter.filteredThisWeek}
      upcomingOffers={filter.filteredUpcoming}
      showBookmarkedOnly={filter.showBookmarkedOnly}
      onToggleBookmarked={filter.toggleBookmarked}
      bookmarkedCount={filter.bookmarkedCount}
      roster={office.roster}
      promoters={office.promoters}
      rivalWarriorMap={office.rivalWarriorMap}
      signedOfferIds={office.signedOfferIds}
      advisorCardMap={advisorCardMap}
      onResponse={office.handleResponse}
    />
  );
}
