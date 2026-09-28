/**
 * Stable Lords — Promoter Directory
 * Browse all promoters in the realm with their personalities,
 * booking history, and current capacity.
 */
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import type { Promoter, BoutOffer } from '@/types/state.types';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Sword, ArrowRight, Building2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { DirectoryStatsGrid, PersonalityGuide } from './promoterDirectory/sections';

const TIER_COLORS: Record<Promoter['tier'], string> = {
  Local: 'bg-muted/40 text-muted-foreground border-border/40',
  Regional: 'bg-accent/20 text-accent border-accent/30',
  National: 'bg-arena-fame/20 text-arena-fame border-arena-fame/30',
  Legendary: 'bg-arena-gold/20 text-arena-gold border-arena-gold/30',
};

/** Calculate active offers for a promoter */
function calculatePromoterStats(
  promoterId: string,
  offers: Record<string, BoutOffer>,
  currentWeek: number
) {
  const { activeThisWeek, pendingProposals, totalOffers } = Object.values(offers).reduce(
    (acc, o) => {
      if (o.promoterId !== promoterId) return acc;
      acc.totalOffers++;
      if (boutOfferAbsoluteWeek(o) === currentWeek && o.status === 'Signed') acc.activeThisWeek++;
      if (o.status === 'Proposed') acc.pendingProposals++;
      return acc;
    },
    { activeThisWeek: 0, pendingProposals: 0, totalOffers: 0 }
  );

  return { activeThisWeek, pendingProposals, totalOffers };
}

/** Preferred-styles badge row (or the no-preferences placeholder). */
function StyleBiasBadges({ biases }: { biases: Promoter['biases'] }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1">
        <Sword className="h-3 w-3" /> Preferred Styles
      </span>
      <div className="flex flex-wrap gap-1">
        {biases.length > 0 ? (
          biases.map((style) => (
            <Badge key={style} variant="secondary" className="text-[9px] uppercase">
              {STYLE_DISPLAY_NAMES[style]}
            </Badge>
          ))
        ) : (
          <span className="text-[10px] italic text-muted-foreground">No style preferences</span>
        )}
      </div>
    </div>
  );
}

const CAPACITY_TEXT_TONE = {
  high: 'text-destructive',
  mid: 'text-arena-gold',
  low: 'text-primary',
} as const;

const CAPACITY_BAR_TONE = {
  high: 'bg-destructive',
  mid: 'bg-arena-gold',
  low: 'bg-primary',
} as const;

/** Weekly capacity meter — color escalates with utilization. */
function CapacityBar({ used, capacity }: { used: number; capacity: number }) {
  const percent = (used / capacity) * 100;
  const tone = percent >= 80 ? 'high' : percent >= 50 ? 'mid' : 'low';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] uppercase tracking-wider">
        <span className="text-muted-foreground font-bold flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Weekly Capacity
        </span>
        <span className={`font-mono font-bold ${CAPACITY_TEXT_TONE[tone]}`}>
          {used}/{capacity}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-none overflow-hidden">
        <div
          className={`h-full rounded-none transition-all duration-500 motion-reduce:transition-none ${CAPACITY_BAR_TONE[tone]}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Three-up offer stats: active this week, pending proposals, lifetime total. */
function OfferStatsGrid({ stats }: { stats: ReturnType<typeof calculatePromoterStats> }) {
  return (
    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
      <div className="text-center space-y-0.5">
        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Active</div>
        <div className="text-lg font-black font-mono">{stats.activeThisWeek}</div>
      </div>
      <div className="text-center space-y-0.5 border-x border-border/50">
        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Pending</div>
        <div className="text-lg font-black font-mono">{stats.pendingProposals}</div>
      </div>
      <div className="text-center space-y-0.5">
        <div className="text-[10px] uppercase text-muted-foreground tracking-wider">Total</div>
        <div className="text-lg font-black font-mono">{stats.totalOffers}</div>
      </div>
    </div>
  );
}

interface PromoterCardProps {
  promoter: Promoter;
  offers: Record<string, BoutOffer>;
  currentWeek: number;
}

function PromoterCard({ promoter, offers, currentWeek }: PromoterCardProps) {
  const personality = PERSONALITY_CONFIG[promoter.personality];
  const tierColor = TIER_COLORS[promoter.tier];
  const stats = calculatePromoterStats(promoter.id, offers, currentWeek);

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 motion-reduce:transition-none">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base font-black uppercase tracking-wider text-primary truncate">
              {promoter.name}
            </CardTitle>
            <div className="text-[10px] font-mono uppercase flex items-center gap-1.5 flex-wrap text-muted-foreground">
              <Badge variant="outline" className={`text-[9px] ${tierColor}`}>
                {promoter.tier}
              </Badge>
              <span className="opacity-60">•</span>
              <span className="opacity-60">Age {promoter.age}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton entityType="promoter" entityId={promoter.id} size="sm" />
            <Badge
              variant="outline"
              className={`text-[10px] uppercase font-bold flex items-center gap-1 ${personality.color}`}
            >
              {personality.icon}
              {personality.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Personality Description */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {personality.description}
        </p>
        <StyleBiasBadges biases={promoter.biases} />
        <CapacityBar used={stats.activeThisWeek} capacity={promoter.capacity} />
        <OfferStatsGrid stats={stats} />
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-[10px] uppercase font-bold"
          asChild
        >
          <Link to="/stable/promoter/$id" params={{ id: promoter.id }}>
            View Profile <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Derived directory state: sorted list, aggregate stats, bookmark count. */
function usePromoterDirectory(showBookmarkedOnly: boolean) {
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

/** Header actions: bookmark filter + Booking Office link. */
function DirectoryActions({
  showBookmarkedOnly,
  onToggle,
  bookmarkedCount,
}: {
  showBookmarkedOnly: boolean;
  onToggle: () => void;
  bookmarkedCount: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <BookmarkFilterToggle
        active={showBookmarkedOnly}
        onToggle={onToggle}
        count={bookmarkedCount}
      />
      <Button
        asChild
        variant="outline"
        className="h-9 text-[11px] uppercase font-black tracking-widest gap-2"
      >
        <Link to="/stable/bouts">
          <Calendar className="h-3.5 w-3.5" />
          Booking Office
        </Link>
      </Button>
    </div>
  );
}

/**
 * Promoter directory.
 */
export default function PromoterDirectory() {
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const { boutOffers, week, absoluteWeek, sortedPromoters, stats, bookmarkedCount } =
    usePromoterDirectory(showBookmarkedOnly);

  return (
    <PageFrame maxWidth="lg">
      <PageHeader
        icon={Building2}
        title="Promoter Directory"
        subtitle={`OPS · PROMOTERS · WEEK ${week}`}
        actions={
          <DirectoryActions
            showBookmarkedOnly={showBookmarkedOnly}
            onToggle={() => setShowBookmarkedOnly((v) => !v)}
            bookmarkedCount={bookmarkedCount}
          />
        }
      />

      {/* Stats Overview */}
      <DirectoryStatsGrid stats={stats} />

      {/* Legend */}
      <PersonalityGuide />

      {/* Promoter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPromoters.map((promoter) => (
          <PromoterCard
            key={promoter.id}
            promoter={promoter}
            offers={boutOffers ?? {}}
            currentWeek={absoluteWeek}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedPromoters.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-bold uppercase tracking-wider">No Promoters Available</p>
            <p className="text-[11px] text-muted-foreground">
              Promoters will appear here as the season progresses.
            </p>
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
