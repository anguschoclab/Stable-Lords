import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { useGameStore, useBookmarks } from '@/state/useGameStore';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { useStableAdvisor } from '@/hooks/useStableAdvisor';
import { useBookingOffice } from './hooks/useBookingOffice';
import { AssetRegistry } from './components/AssetRegistry';
import { HeaderStats, RosterStatusBar, OfferGrid } from './sections';

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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none mb-12">
              <TabsList className="flex w-full h-full bg-transparent p-0 gap-1 rounded-none">
                <TabsTrigger
                  value="this-week"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground border-0"
                >
                  This Week [{filteredThisWeek.length}]
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground border-0"
                >
                  Upcoming Bouts [{filteredUpcoming.length}]
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="this-week" className="mt-0 space-y-8">
              <div className="flex justify-end">
                <BookmarkFilterToggle
                  active={showBookmarkedOnly}
                  onToggle={() => setShowBookmarkedOnly((v) => !v)}
                  count={bookmarkedCount}
                />
              </div>
              <OfferGrid
                offers={filteredThisWeek}
                emptyTitle="No Offers This Week"
                emptyHint="No bout offers have arrived for this week yet."
                roster={roster}
                promoters={promoters}
                rivalWarriorMap={rivalWarriorMap}
                signedOfferIds={signedOfferIds}
                advisorCardMap={advisorCardMap}
                onResponse={handleResponse}
              />
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0 space-y-8">
              <OfferGrid
                offers={filteredUpcoming}
                emptyTitle="No Upcoming Bouts"
                emptyHint="No fight offers are scheduled for future weeks."
                roster={roster}
                promoters={promoters}
                rivalWarriorMap={rivalWarriorMap}
                signedOfferIds={signedOfferIds}
                advisorCardMap={advisorCardMap}
                onResponse={handleResponse}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageFrame>
  );
}
