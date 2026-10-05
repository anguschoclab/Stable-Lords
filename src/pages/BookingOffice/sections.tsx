import { Award, Briefcase, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import type { BoutOffer, Warrior } from '@/types/state.types';
import type { WarriorAdvisorCard } from '@/engine/advisor/types';
import { Surface } from '@/components/ui/Surface';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { Button } from '@/components/ui/button';
import { OfferCard } from './components/OfferCard';
import type { RivalWarriorMap } from './hooks/useBookingOffice';

/** Header action cluster: open-offer count and highest purse. */
export function HeaderStats({
  openOfferCount,
  highestPurse,
}: {
  openOfferCount: number;
  highestPurse: number;
}) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Open Offers
        </span>
        <span className="text-sm font-display font-black text-primary">
          {openOfferCount} Bout Offers
        </span>
      </div>
      <div className="flex flex-col items-end border-l border-white/5 pl-6">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
          Highest Purse
        </span>
        <span className="text-sm font-display font-black text-arena-gold">
          {highestPurse.toLocaleString()}G
        </span>
      </div>
    </div>
  );
}

/** Roster status strip: idle/booked counts plus accept-all-honorable action. */
export function RosterStatusBar({
  idleCount,
  rosterSize,
  onAcceptAll,
}: {
  idleCount: number;
  rosterSize: number;
  onAcceptAll: () => void;
}) {
  return (
    <Surface variant="glass" className="flex items-center gap-12 p-8 border-white/5 mb-12">
      <div className="flex items-center gap-4">
        <ImperialRing size="sm" variant="blood">
          <Target className="h-4 w-4 text-primary" />
        </ImperialRing>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
          Roster Status
        </span>
      </div>

      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">
            Unbooked Warriors
          </span>
          <span
            className={
              'font-display font-black text-lg leading-none ' +
              (idleCount > 0 ? 'text-primary' : 'text-muted-foreground/40')
            }
          >
            {idleCount}
          </span>
        </div>
        <div className="h-8 w-px bg-white/5" />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-muted-foreground/40 tracking-widest mb-1">
            Warriors Booked
          </span>
          <span className="font-display font-black text-lg leading-none">
            {rosterSize - idleCount} / {rosterSize}
          </span>
        </div>
      </div>

      <div className="ml-auto">
        <Button
          variant="outline"
          className="h-10 px-6 rounded-none border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest flex items-center gap-3"
          onClick={onAcceptAll}
        >
          <Award className="h-3.5 w-3.5 text-primary" /> Accept All Honorable Offers
        </Button>
      </div>
    </Surface>
  );
}

/** Empty-state surface for a tab with no offers. */
function EmptyOffers({ title, hint }: { title: string; hint: string }) {
  return (
    <Surface
      variant="glass"
      className="py-48 text-center border-dashed border-white/10 flex flex-col items-center gap-6"
    >
      <ImperialRing size="lg" variant="bronze" className="opacity-20">
        <Briefcase className="h-8 w-8" />
      </ImperialRing>
      <div className="space-y-2">
        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
          {title}
        </p>
        <p className="text-[9px] text-muted-foreground/20 uppercase tracking-widest italic">
          {hint}
        </p>
      </div>
    </Surface>
  );
}

/** Offer grid for one tab — cards flagged with council pick / warning state. */
function OfferGrid(props: {
  offers: BoutOffer[];
  emptyTitle: string;
  emptyHint: string;
  roster: Warrior[];
  promoters: Record<string, { name?: string; tier?: string; personality?: string }>;
  rivalWarriorMap: RivalWarriorMap;
  signedOfferIds: Set<string>;
  advisorCardMap: Map<string, WarriorAdvisorCard>;
  onResponse: (
    offerId: string,
    warriorId: string | undefined,
    response: 'Accepted' | 'Declined'
  ) => void;
}) {
  const { offers, emptyTitle, emptyHint, roster, promoters } = props;
  const { rivalWarriorMap, signedOfferIds, advisorCardMap, onResponse } = props;
  if (offers.length === 0) {
    return <EmptyOffers title={emptyTitle} hint={emptyHint} />;
  }
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {offers.map((o) => {
        const playerWarrior = roster.find((w) => o.warriorIds.includes(w.id));
        const advisorCard = playerWarrior ? advisorCardMap.get(playerWarrior.id) : undefined;
        const isCouncilPick = advisorCard?.fightAdvice.recommendedOfferId === o.id;
        const isWarning =
          !isCouncilPick &&
          (advisorCard?.fightAdvice.dangerLevel === 'LETHAL' ||
            advisorCard?.fightAdvice.dangerLevel === 'HAZARDOUS');
        const councilWarning = isWarning
          ? (advisorCard?.fightAdvice.warnings[0] ?? 'Hazardous Matchup')
          : undefined;

        return (
          <OfferCard
            key={o.id}
            offer={o}
            promoters={promoters}
            roster={roster}
            rivalWarriorMap={rivalWarriorMap}
            signedOfferIds={signedOfferIds}
            onResponse={onResponse}
            isCouncilPick={isCouncilPick}
            councilWarning={councilWarning}
          />
        );
      })}
    </div>
  );
}

/** This-week / upcoming offer tabs with bookmark filtering. */
export function OfferTabs(props: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  thisWeekOffers: BoutOffer[];
  upcomingOffers: BoutOffer[];
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
  bookmarkedCount: number;
  roster: Warrior[];
  promoters: Record<string, { name?: string; tier?: string; personality?: string }>;
  rivalWarriorMap: RivalWarriorMap;
  signedOfferIds: Set<string>;
  advisorCardMap: Map<string, WarriorAdvisorCard>;
  onResponse: (
    offerId: string,
    warriorId: string | undefined,
    response: 'Accepted' | 'Declined'
  ) => void;
}) {
  const { activeTab, onTabChange, thisWeekOffers, upcomingOffers, showBookmarkedOnly } = props;
  const { onToggleBookmarked, bookmarkedCount, roster, promoters, rivalWarriorMap } = props;
  const { signedOfferIds, advisorCardMap, onResponse } = props;
  const gridProps = {
    roster,
    promoters,
    rivalWarriorMap,
    signedOfferIds,
    advisorCardMap,
    onResponse,
  };
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <OfferTabBar thisWeekCount={thisWeekOffers.length} upcomingCount={upcomingOffers.length} />

      <TabsContent value="this-week" className="mt-0 space-y-8">
        <div className="flex justify-end">
          <BookmarkFilterToggle
            active={showBookmarkedOnly}
            onToggle={onToggleBookmarked}
            count={bookmarkedCount}
          />
        </div>
        <OfferGrid
          offers={thisWeekOffers}
          emptyTitle="No Offers This Week"
          emptyHint="No bout offers have arrived for this week yet."
          {...gridProps}
        />
      </TabsContent>

      <TabsContent value="upcoming" className="mt-0 space-y-8">
        <OfferGrid
          offers={upcomingOffers}
          emptyTitle="No Upcoming Bouts"
          emptyHint="No fight offers are scheduled for future weeks."
          {...gridProps}
        />
      </TabsContent>
    </Tabs>
  );
}

/** This-week / upcoming tab strip with per-tab offer counts. */
function OfferTabBar({
  thisWeekCount,
  upcomingCount,
}: {
  thisWeekCount: number;
  upcomingCount: number;
}) {
  const triggerClass =
    'flex-1 h-full rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-[0.3em] text-muted-foreground border-0';
  return (
    <div className="flex items-center h-16 bg-white/[0.02] border border-white/5 p-1 rounded-none mb-12">
      <TabsList className="flex w-full h-full bg-transparent p-0 gap-1 rounded-none">
        <TabsTrigger value="this-week" className={triggerClass}>
          This Week [{thisWeekCount}]
        </TabsTrigger>
        <TabsTrigger value="upcoming" className={triggerClass}>
          Upcoming Bouts [{upcomingCount}]
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
