import { useState, useEffect } from 'react';
import { Globe, Trophy, Swords, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageFrame } from '@/components/ui/PageFrame';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { WorldStats } from '@/components/world/WorldStats';
import { StableRankings } from '@/components/world/StableRankings';
import { WarriorLeaderboard } from '@/components/world/WarriorLeaderboard';
import { RivalIntelligence } from '@/components/world/RivalIntelligence';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { useWorldOverview } from './worldOverview/useWorldOverview';


/** Tab trigger row — shared chrome for Stables / Warriors / Scouting. */
function OverviewTab({
  value,
  label,
  Icon,
}: {
  value: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
    >
      <Icon className="h-3 w-3 mr-2" /> {label}
    </TabsTrigger>
  );
}

/** Section heading line: SCREAMING label + fade rule + optional slot. */
function SectionLabel({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-1">
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
      {children}
    </div>
  );
}

type OverviewData = ReturnType<typeof useWorldOverview>;

/** Stables / Warriors / Scouting tab body. */
function OverviewTabs({
  overview,
  showBookmarkedOnly,
  onToggleBookmarked,
}: {
  overview: OverviewData;
  showBookmarkedOnly: boolean;
  onToggleBookmarked: () => void;
}) {
  const {
    state,
    stableSort,
    warriorSort,
    filteredStableRows,
    stableBookmarkedCount,
    filteredWarriorRows,
    warriorBookmarkedCount,
    toggleStableSort,
    toggleWarriorSort,
  } = overview;

  return (
    <Tabs defaultValue="stables" className="w-full">
      <TabsList className="bg-neutral-900/60 border border-white/5 p-1 mb-6">
        <OverviewTab value="stables" label="Stables" Icon={Trophy} />
        <OverviewTab value="warriors" label="Warriors" Icon={Swords} />
        <OverviewTab value="intel" label="Scouting" Icon={Brain} />
      </TabsList>

      <TabsContent value="stables" className="space-y-6">
        <SectionLabel label="LEAGUE RANKINGS">
          <BookmarkFilterToggle
            active={showBookmarkedOnly}
            onToggle={onToggleBookmarked}
            count={stableBookmarkedCount}
          />
        </SectionLabel>
        <StableRankings
          rows={filteredStableRows}
          sort={stableSort}
          onSort={toggleStableSort}
        />
      </TabsContent>

      <TabsContent value="warriors" className="space-y-6">
        <SectionLabel label="VANGUARD BOARD">
          <BookmarkFilterToggle
            active={showBookmarkedOnly}
            onToggle={onToggleBookmarked}
            count={warriorBookmarkedCount}
          />
        </SectionLabel>
        <WarriorLeaderboard
          rows={filteredWarriorRows}
          sort={warriorSort}
          onSort={toggleWarriorSort}
        />
      </TabsContent>

      <TabsContent value="intel" className="space-y-6">
        <SectionLabel label="Rival Stables" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RivalIntelligence
              rivals={state.rivals || []}
              arenaChampions={state.arenaChampions}
            />
          </div>
          <ReputationQuadrant />
        </div>
      </TabsContent>
    </Tabs>
  );
}

/**
 *
 */
export default function WorldOverview() {
  const [syncing, setSyncing] = useState(true);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSyncing(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const overview = useWorldOverview(showBookmarkedOnly);
  const { state, totalWarriors, totalKills, topStable, topStableId, totalStables } = overview;

  return (
    <PageFrame maxWidth="lg" className="space-y-12 pb-20">
      <PageHeader
        title="World Overview"
        subtitle={`WORLD · ${state.season} · RANKINGS`}
        icon={Globe}
        actions={
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.34em] text-muted-foreground opacity-60">
            <span>Lords Connected: {totalStables}</span>
            <div className="h-4 w-px bg-border/40" />
            {syncing ? (
              <span className="text-primary italic animate-pulse motion-reduce:animate-none">Loading...</span>
            ) : (
              <span className="text-primary">Arena Data Live</span>
            )}
          </div>
        }
      />

      <WorldStats
        stableCount={totalStables}
        warriorCount={totalWarriors}
        killCount={totalKills}
        topStable={topStable}
        topStableId={topStableId}
      />

      <OverviewTabs
        overview={overview}
        showBookmarkedOnly={showBookmarkedOnly}
        onToggleBookmarked={() => setShowBookmarkedOnly((v) => !v)}
      />
    </PageFrame>
  );
}
