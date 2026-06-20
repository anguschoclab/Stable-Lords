import { useState, useMemo, useEffect } from 'react';
import { useWorldState, useGameStore } from '@/state/useGameStore';
import { filterActive } from '@/utils/roster';
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
import type { Warrior } from '@/types/game';
import type { StableRow, WarriorRow } from '@/types/leaderboard';

type SortField =
  | 'rank'
  | 'name'
  | 'fame'
  | 'wins'
  | 'losses'
  | 'kills'
  | 'winRate'
  | 'roster'
  | 'tier';
type WarriorSortField =
  | 'name'
  | 'stable'
  | 'fame'
  | 'wins'
  | 'losses'
  | 'kills'
  | 'winRate'
  | 'style'
  | 'officialRank'
  | 'compositeScore';

/**
 *
 */
export default function WorldOverview() {
  const state = useWorldState();
  const isBookmarked = useGameStore((s) => s.isBookmarked);
  const [stableSort, setStableSort] = useState<{ field: SortField; dir: 'asc' | 'desc' }>({
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

  const stableRows = useMemo<StableRow[]>(() => {
    const rows: StableRow[] = [];
    let pWins = 0;
    let pLosses = 0;
    let pKills = 0;
    for (const w of state.roster) {
      pWins += w.career.wins;
      pLosses += w.career.losses;
      pKills += w.career.kills;
    }
    const pActive = filterActive(state.roster).length;
    const pTotal = pWins + pLosses;

    rows.push({
      id: state.player.id,
      name: state.player.stableName,
      ownerName: state.player.name,
      fame: state.fame,
      wins: pWins,
      losses: pLosses,
      kills: pKills,
      winRate: pTotal > 0 ? Math.round((pWins / pTotal) * 100) : 0,
      roster: pActive,
      tier: 'Player',
      motto: '',
      isPlayer: true,
    });

    for (const r of state.rivals || []) {
      let rWins = 0;
      let rLosses = 0;
      let rKills = 0;
      for (const w of r.roster) {
        rWins += w.career.wins;
        rLosses += w.career.losses;
        rKills += w.career.kills;
      }
      const rActive = filterActive(r.roster).length;
      const rTotal = rWins + rLosses;
      const tmpl = templates.find((t) => t.stableName === r.owner.stableName);
      rows.push({
        id: r.owner.id,
        name: r.owner.stableName,
        ownerName: r.owner.name,
        fame: r.owner.fame,
        wins: rWins,
        losses: rLosses,
        kills: rKills,
        winRate: rTotal > 0 ? Math.round((rWins / rTotal) * 100) : 0,
        roster: rActive,
        tier: r.tier || 'Minor',
        motto: tmpl?.motto ?? '',
        isPlayer: false,
      });
    }

    return rows.sort((a, b) => {
      const f = stableSort.field;
      const dir = stableSort.dir === 'asc' ? 1 : -1;
      if (f === 'name') return a.name.localeCompare(b.name) * dir;
      if (f === 'tier') return a.tier.localeCompare(b.tier) * dir;
      const va = a[f as keyof StableRow] as number;
      const vb = b[f as keyof StableRow] as number;
      return (va - vb) * dir;
    });
  }, [state, stableSort, templates]);

  const filteredStableRows = useMemo(() => {
    if (!showBookmarkedOnly) return stableRows;
    return stableRows.filter((r) => isBookmarked('rival', r.id));
  }, [stableRows, showBookmarkedOnly, isBookmarked]);

  const stableBookmarkedCount = stableRows.filter((r) =>
    isBookmarked('rival', r.id)
  ).length;

  const warriorRows = useMemo<WarriorRow[]>(() => {
    const mapWarrior = (
      w: Warrior,
      stableName: string,
      stableId: string,
      isPlayer: boolean
    ): WarriorRow => {
      const total = w.career.wins + w.career.losses;
      const ranking = state.realmRankings?.[w.id];
      return {
        id: w.id,
        name: w.name,
        stableName,
        stableId,
        fame: w.fame,
        wins: w.career.wins,
        losses: w.career.losses,
        kills: w.career.kills,
        winRate: total > 0 ? Math.round((w.career.wins / total) * 100) : 0,
        style: w.style,
        isPlayer,
        officialRank: ranking?.overallRank || 999,
        compositeScore: ranking?.compositeScore || 0,
      };
    };

    const rows: WarriorRow[] = filterActive(state.roster).map((w) =>
      mapWarrior(w, state.player.stableName, state.player.id, true)
    );

    if (state.rivals) {
      for (const r of state.rivals) {
        const rRoster = r.roster;
        const rName = r.owner.stableName;
        const rId = r.owner.id;
        for (const w of filterActive(rRoster)) {
          rows.push(mapWarrior(w, rName, rId, false));
        }
      }
    }

    // Sort by official rank by default, or the selected field
    return rows.sort((a, b) => {
      const f = warriorSort.field;
      const dir = warriorSort.dir === 'asc' ? 1 : -1;

      // If default (fame), use official rank instead for better meritocracy
      if (f === 'fame' && dir === -1) {
        return a.officialRank - b.officialRank;
      }

      if (f === 'name' || f === 'stable' || f === 'style') {
        const va = f === 'stable' ? a.stableName : a[f as keyof WarriorRow];
        const vb = f === 'stable' ? b.stableName : b[f as keyof WarriorRow];
        return String(va).localeCompare(String(vb)) * dir;
      }
      return ((a[f as keyof WarriorRow] as number) - (b[f as keyof WarriorRow] as number)) * dir;
    });
  }, [state, warriorSort]);

  const filteredWarriorRows = useMemo(() => {
    if (!showBookmarkedOnly) return warriorRows;
    return warriorRows.filter((r) => isBookmarked('warrior', r.id));
  }, [warriorRows, showBookmarkedOnly, isBookmarked]);

  const warriorBookmarkedCount = warriorRows.filter((r) =>
    isBookmarked('warrior', r.id)
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
                field: field as SortField,
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
              <RivalIntelligence rivals={state.rivals || []} />
            </div>
            <ReputationQuadrant />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
