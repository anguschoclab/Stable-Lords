/**
 * Hall of Fights — displays arena history and crowd-remembered epics.
 * Uses the main game state arenaHistory and LoreArchive for hall entries.
 */
import React, { useMemo } from 'react';
import { useWorldState } from '@/state/useGameStore';
import { LoreArchive } from './LoreArchive';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { Trophy, Skull, Sparkles, ScrollText, Newspaper } from 'lucide-react';
import type { FightSummary } from '@/types/state.types';
import { FightLogTab, LegendsTab, StyleStatsTab } from './hallOfFights/tabs';
import Gazette from '@/pages/Gazette';
import Graveyard from '@/pages/Graveyard';

/**
 * Hall of fights.
 */
export const HallOfFights: React.FC = () => {
  const state = useWorldState();

  // Hall entries from LoreArchive
  const hallEntries = useMemo(() => {
    // state.week is used as a dependency to ensure hall entries are refreshed when time advances
    void state.week;
    return LoreArchive.allHall().slice().reverse();
  }, [state.week]);

  // Build fight lookup from game state
  const fightMap = useMemo(() => {
    const map = new Map<string, FightSummary>();
    for (const f of state.arenaHistory) {
      map.set(f.id, f);
    }
    return map;
  }, [state.arenaHistory]);

  // Recent fights grouped by week
  const fightsByWeek = useMemo(() => {
    const groups = new Map<number, typeof state.arenaHistory>();
    for (const f of state.arenaHistory.slice(-50)) {
      const list = groups.get(f.week) ?? [];
      list.push(f);
      groups.set(f.week, list);
    }
    return [...groups.entries()].sort(([a], [b]) => b - a);
  }, [state]);

  // Style stats from all history
  const styleStats = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number; kills: number; fights: number }> =
      {};
    for (const f of state.arenaHistory) {
      const sA = stats[f.styleA] ?? { wins: 0, losses: 0, kills: 0, fights: 0 };
      stats[f.styleA] = sA;
      const sD = stats[f.styleD] ?? { wins: 0, losses: 0, kills: 0, fights: 0 };
      stats[f.styleD] = sD;
      sA.fights++;
      sD.fights++;
      if (f.winner === 'A') {
        sA.wins++;
        sD.losses++;
      }
      if (f.winner === 'D') {
        sD.wins++;
        sA.losses++;
      }
      if (f.by === 'Kill') {
        if (f.winner === 'A') sA.kills++;
        if (f.winner === 'D') sD.kills++;
      }
    }
    return Object.entries(stats)
      .map(([style, s]) => ({
        style,
        ...s,
        winRate: s.fights ? Math.round((s.wins / s.fights) * 100) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [state.arenaHistory]);

  const lifetime = state.lifetimeStats;

  return (
    <PageFrame className="space-y-6">
      <PageHeader
        eyebrow="World"
        title="Chronicle"
        subtitle="LORE · ARENA HISTORY · LEGENDARY BOUTS"
        icon={ScrollText}
      />

      {lifetime && lifetime.bouts > 0 && (
        <div className="flex flex-wrap gap-6 text-xs text-muted-foreground" data-testid="lifetime-stats">
          <span>
            <span className="font-black text-foreground tabular-nums">{lifetime.bouts}</span> bouts all-time
          </span>
          <span>
            <span className="font-black text-arena-blood tabular-nums">{lifetime.kills}</span> deaths all-time
          </span>
          <span>
            <span className="font-black text-foreground tabular-nums">{lifetime.retirements}</span> retirements all-time
          </span>
        </div>
      )}

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history" className="gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> Fight Log
          </TabsTrigger>
          <TabsTrigger value="legends" className="gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Legends
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Style Stats
          </TabsTrigger>
          <TabsTrigger value="gazette" className="gap-1.5">
            <Newspaper className="h-3.5 w-3.5" /> Gazette
          </TabsTrigger>
          <TabsTrigger value="graveyard" className="gap-1.5">
            <Skull className="h-3.5 w-3.5" /> Graveyard
          </TabsTrigger>
        </TabsList>

        {/* Fight History */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <FightLogTab fightsByWeek={fightsByWeek} />
        </TabsContent>

        {/* Legends — Hall of Fame fights */}
        <TabsContent value="legends" className="space-y-4 mt-4">
          <LegendsTab hallEntries={hallEntries} fightMap={fightMap} />
        </TabsContent>

        {/* Style Stats */}
        <TabsContent value="stats" className="mt-4">
          <StyleStatsTab styleStats={styleStats} />
        </TabsContent>

        {/* Gazette */}
        <TabsContent value="gazette" className="mt-4">
          <Gazette />
        </TabsContent>

        {/* Graveyard */}
        <TabsContent value="graveyard" className="mt-4">
          <Graveyard />
        </TabsContent>
      </Tabs>
    </PageFrame>
  );
};

export default HallOfFights;
