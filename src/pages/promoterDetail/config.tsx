import {
  Sparkles,
  Building2,
  DollarSign,
  Award,
  AlertTriangle,
} from 'lucide-react';
import type { Promoter, PromoterPersonality, BoutOffer } from '@/types/state.types';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';

/** Personality display configuration keyed by promoter personality. */
export const PERSONALITY_CONFIG: Record<
  PromoterPersonality,
  {
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    traits: string[];
  }
> = {
  Greedy: {
    color: 'text-arena-gold',
    bgColor: 'bg-arena-gold/10',
    icon: <DollarSign className="h-5 w-5" />,
    label: 'Greedy',
    description:
      'Prioritizes high-purse matchups over competitive balance. Offers 15% higher purses but generates 10% less hype.',
    traits: ['+15% Purse Bonus', '-10% Hype Penalty', 'Wide skill gap tolerance (0.35)'],
  },
  Honorable: {
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    icon: <Award className="h-5 w-5" />,
    label: 'Honorable',
    description:
      'Values fair competition and warrior safety. Generates 10% more hype with tightly matched skill gaps (0.10).',
    traits: ['+10% Hype Bonus', 'Tight skill matching', 'Warrior safety priority'],
  },
  Sadistic: {
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Sadistic',
    description:
      'Seeks dramatic, high-risk matchups with injury potential. 25% hype bonus for matchups involving wounded warriors.',
    traits: ['+25% Hype with injuries', 'High-kill matchups', 'Moderate skill gap (0.25)'],
  },
  Flashy: {
    color: 'text-arena-fame',
    bgColor: 'bg-arena-fame/10',
    icon: <Sparkles className="h-5 w-5" />,
    label: 'Flashy',
    description:
      'Fame-focused promoter who loves showy fighters. 15% hype bonus for Aggressive/Impaling styles. 20% purse bonus.',
    traits: ['+15% Hype (showy styles)', '+20% Purse', 'Moderate skill gap (0.25)'],
  },
  Corporate: {
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    icon: <Building2 className="h-5 w-5" />,
    label: 'Corporate',
    description:
      'Stable, predictable matchmaking with consistent quality. 5% purse bonus and conservative skill gaps (0.20).',
    traits: ['+5% Purse Bonus', 'Conservative matching', 'Reliable scheduling'],
  },
};

/** Tier badge/background styling keyed by promoter tier. */
export const TIER_COLORS: Record<Promoter['tier'], { badge: string; bg: string }> = {
  Local: {
    badge: 'bg-muted/40 text-muted-foreground border-border/40',
    bg: 'bg-muted/10',
  },
  Regional: {
    badge: 'bg-accent/20 text-accent border-accent/30',
    bg: 'bg-accent/5',
  },
  National: {
    badge: 'bg-arena-fame/20 text-arena-fame border-arena-fame/30',
    bg: 'bg-arena-fame/5',
  },
  Legendary: {
    badge: 'bg-arena-gold/20 text-arena-gold border-arena-gold/30',
    bg: 'bg-arena-gold/10',
  },
};

/** Format large numbers */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/** Calculate promoter statistics */
export function calculateStats(
  promoter: Promoter,
  offers: Record<string, BoutOffer>,
  currentWeek: number
) {
  const { signedOffers, proposedOffers, thisWeekBouts, totalOffers, totalHype, totalPurse } =
    Object.values(offers).reduce(
      (acc, o) => {
        if (o.promoterId !== promoter.id) return acc;
        acc.totalOffers++;
        acc.totalHype += o.hype;
        acc.totalPurse += o.purse;
        if (o.status === 'Signed') {
          acc.signedOffers.push(o);
          if (boutOfferAbsoluteWeek(o) === currentWeek) acc.thisWeekBouts.push(o);
        }
        if (o.status === 'Proposed') acc.proposedOffers.push(o);
        return acc;
      },
      {
        signedOffers: [] as BoutOffer[],
        proposedOffers: [] as BoutOffer[],
        thisWeekBouts: [] as BoutOffer[],
        totalOffers: 0,
        totalHype: 0,
        totalPurse: 0,
      }
    );

  const avgPurse = totalOffers > 0 ? totalPurse / totalOffers : 0;

  return {
    totalOffers,
    signedCount: signedOffers.length,
    proposedCount: proposedOffers.length,
    thisWeekActive: thisWeekBouts.length,
    capacityUsed: thisWeekBouts.length,
    capacityPercent: (thisWeekBouts.length / promoter.capacity) * 100,
    avgPurse: Math.round(avgPurse),
    totalHype,
  };
}

/** Promoter offer/capacity statistics. */
export type PromoterStats = ReturnType<typeof calculateStats>;
/** Display config entry for one promoter personality. */
export type PersonalityConfig = (typeof PERSONALITY_CONFIG)[PromoterPersonality];
