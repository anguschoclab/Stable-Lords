import { useMemo, useState } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useReputationState } from '@/state/selectors';
import { useShallow } from 'zustand/react/shallow';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { computeStableReputation } from '@/engine/stableReputation';

/**
 *
 */
export type TabId = 'overview' | 'roster' | 'rep';

/**
 *
 */
export function useControlCenter() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const {
    player,
    week,
    season,
    arenaHistory,
    boutOffers,
    roster,
    treasury,
    fame,
    rivals,
    realmRankings,
  } = useGameStore(
    useShallow((s) => ({
      player: s.player,
      week: s.week,
      season: s.season,
      arenaHistory: s.arenaHistory,
      boutOffers: s.boutOffers,
      roster: s.roster,
      treasury: s.treasury,
      fame: s.fame,
      rivals: s.rivals,
      realmRankings: s.realmRankings,
    }))
  );

  const stats = useMemo(() => calculateStableStats(roster), [roster]);
  const totalBouts = arenaHistory.length;
  const killRate = totalBouts > 0 ? Math.round((stats.totalKills / totalBouts) * 100) : 0;

  const stableRank = useMemo(() => {
    if (!rivals || rivals.length === 0) return null;
    const higherCount = rivals.filter((r) => (r.fame ?? 0) > (fame ?? 0)).length;
    return higherCount + 1;
  }, [rivals, fame]);

  const topWarriorRank = useMemo(() => {
    if (!realmRankings || Object.keys(realmRankings).length === 0) return null;
    let best: number | null = null;
    for (const w of roster) {
      const entry = realmRankings[w.id];
      if (entry && entry.overallRank > 0) {
        if (best === null || entry.overallRank < best) {
          best = entry.overallRank;
        }
      }
    }
    return best;
  }, [roster, realmRankings]);

  const worldState = useReputationState();
  const rep = useMemo(() => computeStableReputation(worldState), [worldState]);

  return {
    activeTab,
    setActiveTab,
    player,
    week,
    season,
    arenaHistory,
    boutOffers,
    roster,
    stats,
    totalBouts,
    killRate,
    stableRank,
    topWarriorRank,
    rivals,
    rep,
    treasury,
    fame,
  };
}
