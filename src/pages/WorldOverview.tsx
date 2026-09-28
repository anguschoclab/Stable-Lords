import { useState, useMemo, useEffect } from 'react';
import { useWorldState, useBookmarks } from '@/state/useGameStore';
import { bookmarkIdsByType } from '@/state/slices/bookmarksSlice';
import { Globe, Trophy, Swords, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { BookmarkFilterToggle } from '@/components/bookmarks/BookmarkFilterToggle';
import { WorldStats } from '@/components/world/WorldStats';
import { StableRankings } from '@/components/world/StableRankings';
import { WarriorLeaderboard } from '@/components/world/WarriorLeaderboard';
import { RivalIntelligence } from '@/components/world/RivalIntelligence';
import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';
import { getStableTemplates } from '@/engine/rivals';
import type { StableRow, WarriorRow } from '@/types/leaderboard';
import {
  buildStableRows,
  buildWarriorRows,
  type StableSortField,
  type WarriorSortField,
} from './worldOverview/rows';


/**
 *
 */
export default function WorldOverview() {
  const state = useWorldState();
  const bookmarks = useBookmarks();
  const [stableSort, setStableSort] = useState<{ field: StableSortField; dir: 'asc' | 'desc' }>({
    field: 'fame',
    dir: 'desc',
  });
  const [warriorSort, setWarriorSort] = useState<{ field: WarriorSortField; dir: 'asc' | 'desc' }>({
    field: 'fame',
    dir: 'desc',
  });
  const [syncing, setSyncing] = useState(true);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSyncing(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const templates = useMemo(() => getStableTemplates(), []);

  const stableRows = useMemo<StableRow[]>(
    () => buildStableRows(state, stableSort, templates),
    [state, stableSort, templates]
  );

  const bookmarkIds = useMemo(() => bookmarkIdsByType(bookmarks), [bookmarks]);

  const filteredStableRows = useMemo(() => {
    if (!showBookmarkedOnly) return stableRows;
    const ids = bookmarkIds.get('rival');
    return stableRows.filter((r) => ids?.has(r.id));
  }, [stableRows, showBookmarkedOnly, bookmarkIds]);

  const stableBookmarkedCount = stableRows.filter(
    (r) => bookmarkIds.get('rival')?.has(r.id)
  ).length;

  const warriorRows = useMemo<WarriorRow[]>(
    () => buildWarriorRows(state, warriorSort),
    [state, warriorSort]
  );

  const filteredWarriorRows = useMemo(() => {
    if (!showBookmarkedOnly) return warriorRows;
    const ids = bookmarkIds.get('warrior');
    return warriorRows.filter((r) => ids?.has(r.id));
  }, [warriorRows, showBookmarkedOnly, bookmarkIds]);

  const warriorBookmarkedCount = warriorRows.filter(
    (r) => bookmarkIds.get('warrior')?.has(r.id)
  ).length;

  const totalWarriors = stableRows.reduce((s, r) => s + r.roster, 0);
  const totalKills = stableRows.reduce((s, r) => s + (r.kills || 0), 0);
  const topStable = stableRows[0]?.name ?? '—';
  const topStableId = stableRows[0]?.id ?? null;

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <PageHeader
        title="World Overview"
        subtitle={`WORLD · ${state.season} · RANKINGS`}
        icon={Globe}
        actions={
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.34em] text-muted-foreground opacity-60">
            <span>Lords Connected: {stableRows.length}</span>
            <div className="h-4 w-px bg-border/40" />
            {syncing ? (
              <span className="text-primary italic animate-pulse">Loading...</span>
            ) : (
              <span className="text-primary">Arena Data Live</span>
            )}
          </div>
        }
      />

      <WorldStats
        stableCount={stableRows.length}
        warriorCount={totalWarriors}
        killCount={totalKills}
        topStable={topStable}
        topStableId={topStableId}
      />

      <Tabs defaultValue="stables" className="w-full">
        <TabsList className="bg-neutral-900/60 border border-white/5 p-1 mb-6">
          <TabsTrigger
            value="stables"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
          >
            <Trophy className="h-3 w-3 mr-2" /> Stables
          </TabsTrigger>
          <TabsTrigger
            value="warriors"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
          >
            <Swords className="h-3 w-3 mr-2" /> Warriors
          </TabsTrigger>
          <TabsTrigger
            value="intel"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground uppercase tracking-widest text-[10px] font-black py-2 px-6"
          >
            <Brain className="h-3 w-3 mr-2" /> Scouting
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stables" className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              LEAGUE RANKINGS
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
            <BookmarkFilterToggle
              active={showBookmarkedOnly}
              onToggle={() => setShowBookmarkedOnly((v) => !v)}
              count={stableBookmarkedCount}
            />
          </div>
          <StableRankings
            rows={filteredStableRows}
            sort={stableSort}
            onSort={(field) =>
              setStableSort((prev) => ({
                field: field as StableSortField,
                dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
              }))
            }
          />
        </TabsContent>

        <TabsContent value="warriors" className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              VANGUARD BOARD
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
            <BookmarkFilterToggle
              active={showBookmarkedOnly}
              onToggle={() => setShowBookmarkedOnly((v) => !v)}
              count={warriorBookmarkedCount}
            />
          </div>
          <WarriorLeaderboard
            rows={filteredWarriorRows}
            sort={warriorSort}
            onSort={(field) =>
              setWarriorSort((prev) => ({
                field: field as WarriorSortField,
                dir: prev.field === field && prev.dir === 'desc' ? 'asc' : 'desc',
              }))
            }
          />
        </TabsContent>

        <TabsContent value="intel" className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Rival Stables
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-border/20 to-transparent" />
          </div>
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
    </div>
  );
}
