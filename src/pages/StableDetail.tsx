import { useMemo, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { isActive, isDead } from '@/engine/warrior/warriorStatus';
import { Shield, ArrowLeft, LayoutDashboard, FileText, History } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { Button } from '@/components/ui/button';
import { PageFrame } from '@/components/ui/PageFrame';
import { ImperialRing } from '@/components/ui/ImperialRing';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import type { RivalStableData } from '@/types/game';
import { StableRosterTab } from '@/components/stable/StableRosterTab';
import { StableLogsTab } from '@/components/stable/StableLogsTab';
import { StableSidebar, StableOverviewTab, type TierConfig } from './stableDetail/sections';

const TIER_CONFIG: Record<string, TierConfig> = {
  Legendary: { label: 'Legendary', ring: 'gold', text: 'text-arena-gold' },
  Major: { label: 'Major', ring: 'blood', text: 'text-primary' },
  Established: { label: 'Established', ring: 'silver', text: 'text-foreground' },
  Minor: { label: 'Minor', ring: 'bronze', text: 'text-muted-foreground' },
};

/**
 * Stable detail.
 */

/**
 * Stable detail.
 */
export default function StableDetail() {
  const { id } = useParams({ strict: false }) as { id: string };

  const state = useGameStore(
    useShallow((s) => ({
      rivals: s.rivals,
      arenaHistory: s.arenaHistory,
    }))
  );
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ROSTER' | 'LOGS'>('OVERVIEW');

  const rivalMap = useMemo(() => {
    const map = new Map<string, RivalStableData>();
    for (const r of state.rivals ?? []) {
      map.set(r.owner.id as string, r);
    }
    return map;
  }, [state.rivals]);

  const rival = useMemo(() => (id ? rivalMap.get(id) : undefined), [rivalMap, id]);

  if (!rival) {
    return (
      <PageFrame
        maxWidth="xl"
        className="flex flex-col items-center justify-center py-48 text-center"
      >
        <ImperialRing size="lg" variant="bronze" className="opacity-20 mb-8">
          <Shield className="h-10 w-10" />
        </ImperialRing>
        <div className="space-y-6">
          <p className="text-[12px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">
            Stable Identifier Not Found
          </p>
          <Button
            variant="outline"
            asChild
            className="h-12 px-8 font-black uppercase text-[10px] tracking-widest rounded-none border-white/10 hover:bg-white/5"
          >
            <Link to="/world/scouting">Return to World Overview</Link>
          </Button>
        </div>
      </PageFrame>
    );
  }

  const activeRoster = rival.roster.filter(isActive);
  const deadWarriors = rival.roster.filter(isDead);
  const {
    wins: totalWins,
    losses: totalLosses,
    kills: totalKills,
  } = rival.roster.reduce(
    (acc, w) => ({
      wins: acc.wins + w.career.wins,
      losses: acc.losses + w.career.losses,
      kills: acc.kills + w.career.kills,
    }),
    { wins: 0, losses: 0, kills: 0 }
  );
  const totalFights = totalWins + totalLosses;
  const winRate = totalFights > 0 ? Math.round((totalWins / totalFights) * 100) : 0;

  const tierCfg = TIER_CONFIG[rival.tier ?? 'Minor'] ??
    TIER_CONFIG.Minor ?? {
      label: 'Minor',
      ring: 'bronze' as const,
      text: 'text-muted-foreground',
    };

  const stableWarriorIds = new Set<string>(rival.roster.map((w) => w.id));
  const recentBouts = state.arenaHistory
    .filter((f) => stableWarriorIds.has(f.warriorIdA) || stableWarriorIds.has(f.warriorIdD))
    .slice(-12)
    .reverse();

  return (
    <PageFrame maxWidth="xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="hover:bg-transparent -ml-4 opacity-40 hover:opacity-100 transition-all motion-reduce:transition-none"
        >
          <Link
            to="/world/scouting"
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Scouting
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Rival Stable"
        title={rival.owner.stableName}
        subtitle={`${(rival.owner.personality ?? '').toUpperCase()} · ${rival.tier?.toUpperCase() || 'MINOR'} CLASS`}
        icon={Shield}
        actions={
          <div className="flex items-center gap-8">
            <BookmarkButton entityType="rival" entityId={rival.owner.id} size="md" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
                Fame
              </span>
              <span className="text-xl font-display font-black text-arena-gold">
                {rival.owner.fame}
              </span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        <StableSidebar rival={rival} tierCfg={tierCfg} winRate={winRate} />


        {/* Main Content: Tabbed Analysis */}
        <div className="lg:col-span-8 space-y-8">
          {/* Dossier Tabs */}
          <div className="flex items-center gap-8 border-b border-white/5 -mt-4">
            {(
              [
                { id: 'OVERVIEW', icon: LayoutDashboard },
                { id: 'ROSTER', icon: FileText },
                { id: 'LOGS', icon: History },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative motion-reduce:transition-none',
                  activeTab === tab.id
                    ? 'text-primary'
                    : 'text-muted-foreground/40 hover:text-foreground'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.id}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {activeTab === 'OVERVIEW' && (
              <StableOverviewTab
                activeRoster={activeRoster}
                deadWarriors={deadWarriors}
                totalWins={totalWins}
                totalLosses={totalLosses}
                totalKills={totalKills}
              />
            )}

            {activeTab === 'ROSTER' && <StableRosterTab activeRoster={activeRoster} />}

            {activeTab === 'LOGS' && (
              <StableLogsTab recentBouts={recentBouts} stableWarriorIds={stableWarriorIds} />
            )}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
