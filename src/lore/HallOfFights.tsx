/**
 * Hall of Fights — displays arena history and crowd-remembered epics.
 * Uses the main game state arenaHistory and LoreArchive for hall entries.
 */
import React from 'react';
import { useWorldState } from '@/state/useGameStore';
import type { LifetimeStats } from '@/types/state/simulation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageFrame } from '@/components/ui/PageFrame';
import { PageHeader } from '@/components/ui/PageHeader';
import { Trophy, Skull, Sparkles, ScrollText, Newspaper } from 'lucide-react';
import { FightLogTab, LegendsTab, StyleStatsTab } from './hallOfFights/tabs';
import { useHallData } from './hallOfFights/useHallData';
import Gazette from '@/pages/Gazette';
import Graveyard from '@/pages/Graveyard';

/**
 * Hall of fights.
 */
export const HallOfFights: React.FC = () => {
  const state = useWorldState();
  const { hallEntries, fightMap, fightsByWeek, styleStats } = useHallData(state);

  const lifetime = state.lifetimeStats;

  return (
    <PageFrame className="space-y-6">
      <PageHeader
        eyebrow="World"
        title="Chronicle"
        subtitle="LORE · ARENA HISTORY · LEGENDARY BOUTS"
        icon={ScrollText}
      />

      {lifetime && lifetime.bouts > 0 && <LifetimeStatsRow lifetime={lifetime} />}

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

/** All-time counter strip: bouts, deaths, retirements. */
function LifetimeStatsRow({ lifetime }: { lifetime: LifetimeStats }) {
  return (
    <div
      className="flex flex-wrap gap-6 text-xs text-muted-foreground"
      data-testid="lifetime-stats"
    >
      <span>
        <span className="font-black text-foreground tabular-nums">{lifetime.bouts}</span> bouts
        all-time
      </span>
      <span>
        <span className="font-black text-arena-blood tabular-nums">{lifetime.kills}</span> deaths
        all-time
      </span>
      <span>
        <span className="font-black text-foreground tabular-nums">{lifetime.retirements}</span>{' '}
        retirements all-time
      </span>
    </div>
  );
}
