import type { Promoter, BoutOffer } from '@/types/state.types';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { PERSONALITY_CONFIG } from '@/data/promoterPersonalityConfig';
import { STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Sword, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { AvatarForEntity } from '@/components/avatar';

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

export function PromoterCard({ promoter, offers, currentWeek }: PromoterCardProps) {
  const personality = PERSONALITY_CONFIG[promoter.personality];
  const tierColor = TIER_COLORS[promoter.tier];
  const stats = calculatePromoterStats(promoter.id, offers, currentWeek);

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 motion-reduce:transition-none">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <AvatarForEntity
              entityId={promoter.id}
              entityType="promoter"
              source={promoter}
              size="sm"
              className="border border-white/10 bg-neutral-950"
            />
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
