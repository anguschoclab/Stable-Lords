import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { PageFrame } from '@/components/ui/PageFrame';
import { SectionDivider } from '@/components/ui/SectionDivider';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Button } from '@/components/ui/button';
import { Briefcase, Award, Target } from 'lucide-react';
import { useGameStore } from '@/state/useGameStore';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { useBookingOffice } from './hooks/useBookingOffice';
import { OfferCard } from './components/OfferCard';
import { AssetRegistry } from './components/AssetRegistry';

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
  const isBookmarked = useGameStore((s) => s.isBookmarked);
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
        title="Booking Intelligence"
        subtitle={`OPS · CONTRACT_MANAGEMENT · WK ${week}`}
        actions={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Market Saturation
              </span>
              <span className="text-sm font-display font-black text-primary">
                {thisWeekOffers.length + upcomingOffers.length} Live Proposals
              </span>
            </div>
            <div className="flex flex-col items-end border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                Peak Valuation
              </span>
              <span className="text-sm font-display font-black text-arena-gold">
                {highestPurse.toLocaleString()}G CAP
              </span>
            </div>
          </div>
        }
      />

      <Surface variant="glass" className="flex items-center gap-12 p-8 border-white/5 mb-12">
        <div className="flex items-center gap-4">
          <ImperialRing size="sm" variant="blood">
            <Target className="h-4 w-4 text-primary" />
          </ImperialRing>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
            Operational Overview
          </span>
        </div>

        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">
              Idle Assets
            </span>
            <span
              className={
                'font-display font-black text-lg leading-none ' +
                (idleWarriors.length > 0 ? 'text-primary' : 'text-muted-foreground/40')
              }
            >
              {idleWarriors.length}
            </span>
          </div>
          <div className="h-8 w-px bg-white/5" />
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">
              Personnel Deployed
            </span>
            <span className="font-display font-black text-lg leading-none">
              {roster.length - idleWarriors.length} / {roster.length}
            </span>
          </div>
        </div>

        <div className="ml-auto">
          <Button
            variant="outline"
            className="h-10 px-6 rounded-none border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest flex items-center gap-3"
            onClick={acceptAllHonorable}
          >
            <Award className="h-3.5 w-3.5 text-primary" /> Execute All Safe Protocols
          </Button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Left Rail Asset Registry */}
        <aside className="space-y-8">
          <SectionDivider label="Asset Registry" />
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
                  Immediate Proposals [{filteredThisWeek.length}]
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex-1 h-full rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground border-0"
                >
                  Future Slates [{filteredUpcoming.length}]
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
              {filteredThisWeek.length === 0 ? (
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Briefcase className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Zero Proposals Found
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      No immediate contract offers detected for the current window.
                    </p>
                  </div>
                </Surface>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {filteredThisWeek.map((o) => (
                    <OfferCard
                      key={o.id}
                      offer={o}
                      promoters={promoters}
                      roster={roster}
                      rivalWarriorMap={rivalWarriorMap}
                      signedOfferIds={signedOfferIds}
                      onResponse={handleResponse}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-0 space-y-8">
              {filteredUpcoming.length === 0 ? (
                <Surface
                  variant="glass"
                  className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
                >
                  <ImperialRing size="lg" variant="bronze" className="opacity-20">
                    <Briefcase className="h-8 w-8" />
                  </ImperialRing>
                  <div className="space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
                      Upcoming Slates Empty
                    </p>
                    <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
                      No future engagement projections currently available.
                    </p>
                  </div>
                </Surface>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {filteredUpcoming.map((o) => (
                    <OfferCard
                      key={o.id}
                      offer={o}
                      promoters={promoters}
                      roster={roster}
                      rivalWarriorMap={rivalWarriorMap}
                      signedOfferIds={signedOfferIds}
                      onResponse={handleResponse}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageFrame>
  );
}
