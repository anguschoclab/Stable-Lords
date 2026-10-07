import { useMemo, useState } from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { Shield, ArrowLeft, LayoutDashboard, FileText, History } from 'lucide-react';
import { BookmarkButton } from '@/components/bookmarks/BookmarkButton';
import { Button } from '@/components/ui/button';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconTabStrip } from '@/components/ui/IconTabStrip';
import type { RivalStableData } from '@/types/game';
import { StableRosterTab } from '@/components/stable/StableRosterTab';
import { StableLogsTab } from '@/components/stable/StableLogsTab';
import { StableNotFound, StableSidebar, StableOverviewTab } from './stableDetail/sections';
import { deriveStableStats } from './stableDetail/deriveStableStats';

type DetailTab = 'OVERVIEW' | 'ROSTER' | 'LOGS';

const DETAIL_TABS = [
  { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
  { id: 'ROSTER', label: 'Roster', icon: FileText },
  { id: 'LOGS', label: 'Logs', icon: History },
] as const;

/** Dossier tab strip — underlined active state. */
function DossierTabs({
  activeTab,
  onChange,
}: {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  return <IconTabStrip tabs={DETAIL_TABS} activeTab={activeTab} onChange={onChange} className="-mt-4" />;
}

/** Back-to-scouting link. */
function BackLink() {
  return (
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
  );
}

/** Header actions: bookmark + fame readout. */
function HeaderActions({ rival }: { rival: RivalStableData }) {
  return (
    <div className="flex items-center gap-8">
      <BookmarkButton entityType="rival" entityId={rival.owner.id} size="md" />
      <div className="flex flex-col items-end">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">
          Fame
        </span>
        <span className="text-xl font-display font-black text-arena-gold">{rival.owner.fame}</span>
      </div>
    </div>
  );
}

/** Active tab body. */
function TabBody({
  activeTab,
  stats,
}: {
  activeTab: DetailTab;
  stats: ReturnType<typeof deriveStableStats>;
}) {
  const {
    activeRoster,
    deadWarriors,
    totalWins,
    totalLosses,
    totalKills,
    stableWarriorIds,
    recentBouts,
  } = stats;
  return (
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
  );
}

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
  const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW');

  const rivalMap = useMemo(() => {
    const map = new Map<string, RivalStableData>();
    for (const r of state.rivals ?? []) {
      map.set(r.owner.id as string, r);
    }
    return map;
  }, [state.rivals]);

  const rival = useMemo(() => (id ? rivalMap.get(id) : undefined), [rivalMap, id]);

  if (!rival) return <StableNotFound />;

  const stats = deriveStableStats(rival, state.arenaHistory);

  return (
    <PageFrame maxWidth="xl">
      <BackLink />

      <PageHeader
        eyebrow="Rival Stable"
        title={rival.owner.stableName}
        subtitle={`${(rival.owner.personality ?? '').toUpperCase()} · ${rival.tier?.toUpperCase() || 'MINOR'} CLASS`}
        icon={Shield}
        actions={<HeaderActions rival={rival} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
        <StableSidebar rival={rival} tierCfg={stats.tierCfg} winRate={stats.winRate} />

        {/* Main Content: Tabbed Analysis */}
        <div className="lg:col-span-8 space-y-8">
          <DossierTabs activeTab={activeTab} onChange={setActiveTab} />
          <TabBody activeTab={activeTab} stats={stats} />
        </div>
      </div>
    </PageFrame>
  );
}
