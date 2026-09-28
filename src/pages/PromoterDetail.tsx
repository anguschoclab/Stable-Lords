/**
 * Stable Lords — Promoter Detail
 * Deep dive into a single promoter's history, personality, and active offers.
 */
import { useMemo, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, History, Target } from 'lucide-react';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { PERSONALITY_CONFIG, TIER_COLORS, calculateStats } from './promoterDetail/config';
import { OverviewTab, HistoryTab, OffersTab } from './promoterDetail/tabs';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import SubNav, { type SubNavTab } from '@/components/layout/SubNav';

const TABS: SubNavTab[] = [
  { id: 'overview', label: 'Overview', icon: <Target className="h-4 w-4" /> },
  { id: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
  { id: 'offers', label: 'Active Offers', icon: <Calendar className="h-4 w-4" /> },
];

type Promoter = NonNullable<ReturnType<typeof usePromoterLookup>['promoter']>;

/** Resolve the promoter, derived stats, and the sorted offer list for `id`. */
function usePromoterLookup(id: string) {
  const { promoters, boutOffers, absoluteWeek } = useGameStore(
    useShallow((s) => ({
      promoters: s.promoters,
      boutOffers: s.boutOffers,
      absoluteWeek: s.absoluteWeek,
    }))
  );

  const promoter = useMemo(() => {
    return Object.values(promoters || {}).find((p) => p.id === id);
  }, [id, promoters]);

  const stats = useMemo(() => {
    if (!promoter) return null;
    return calculateStats(promoter, boutOffers || {}, absoluteWeek);
  }, [promoter, boutOffers, absoluteWeek]);

  const promoterOffers = useMemo(() => {
    if (!promoter) return [];
    return Object.values(boutOffers || {})
      .filter((o) => o.promoterId === promoter.id)
      .sort((a, b) => boutOfferAbsoluteWeek(a) - boutOfferAbsoluteWeek(b));
  }, [promoter, boutOffers]);

  return { promoter, stats, promoterOffers };
}

/** Tier-styled hero band: tier badge, personality blurb, bookmark. */
function PromoterHero({ promoter }: { promoter: Promoter }) {
  const personality = PERSONALITY_CONFIG[promoter.personality];
  const tierStyle = TIER_COLORS[promoter.tier];

  return (
    <div className={`p-6 rounded-none border ${tierStyle.bg} ${tierStyle.badge} border-current`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={`text-xs ${tierStyle.badge}`}>
              {promoter.tier}
            </Badge>
          </div>
          <p className="text-sm opacity-80">{personality.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <BookmarkButton entityType="promoter" entityId={promoter.id} size="md" />
          <div className={`p-4 rounded-none ${personality.bgColor} flex items-center gap-3`}>
            <div className={personality.color}>{personality.icon}</div>
            <div>
              <div className={`font-bold ${personality.color}`}>{personality.label}</div>
              <div className="text-xs opacity-60">Personality</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoterNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-muted-foreground">Promoter not found.</p>
      <Link to="/stable/promoters">
        <Button variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
        </Button>
      </Link>
    </div>
  );
}

/**
 * Promoter detail.
 */
export default function PromoterDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { promoter, stats, promoterOffers } = usePromoterLookup(id);
  const [activeTab, setActiveTab] = useState('overview');

  if (!promoter || !stats) {
    return <PromoterNotFound />;
  }

  const personality = PERSONALITY_CONFIG[promoter.personality];

  return (
    <PageFrame className="space-y-6">
      <PageHeader
        eyebrow="Promoter"
        title={promoter.name}
        subtitle={`OPS · PROMOTERS · ${promoter.tier.toUpperCase()} CIRCUIT`}
        actions={
          <Link to="/stable/promoters">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Directory
            </Button>
          </Link>
        }
      />

      {/* Hero Section */}
      <PromoterHero promoter={promoter} />

      <SubNav tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <OverviewTab promoter={promoter} stats={stats} personality={personality} />
      )}
      {activeTab === 'history' && <HistoryTab promoter={promoter} />}
      {activeTab === 'offers' && <OffersTab offers={promoterOffers} />}
    </PageFrame>
  );
}
