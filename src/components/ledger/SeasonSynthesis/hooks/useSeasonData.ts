import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { calculateStableStats } from '@/engine/stats/stableStats';
import { computeMetaDrift } from '@/engine/metaDrift';

/**
 *
 */
export interface RivalPerformance {
  id: string;
  name: string;
  philosophy?: string;
  winRate: number;
  totalWins: number;
  totalLosses: number;
  totalKills: number;
}

/**
 *
 */
export function useSeasonData() {
  const { rivals, ownerGrudges, newsletter, arenaHistory, season } = useGameStore(
    useShallow((s) => ({
      rivals: s.rivals,
      ownerGrudges: s.ownerGrudges,
      newsletter: s.newsletter,
      arenaHistory: s.arenaHistory,
      season: s.season,
    }))
  );

  const rivalPerformance = useMemo<RivalPerformance[]>(() => {
    return (rivals ?? [])
      .map((r) => {
        const stats = calculateStableStats(r.roster);
        return {
          id: r.owner.id,
          name: r.owner.stableName,
          philosophy: r.philosophy,
          winRate: stats.winRate,
          totalWins: stats.totalWins,
          totalLosses: stats.totalLosses,
          totalKills: stats.totalKills,
        };
      })
      .sort((a, b) => b.winRate - a.winRate);
  }, [rivals]);

  const seasonGazette = useMemo<string[]>(() => {
    const summaries = (newsletter ?? []).filter((n) => n.title.endsWith('Season Summary'));
    if (summaries.length === 0) return [];
    const latest = summaries.reduce((best, n) => (n.week > best.week ? n : best));
    return latest.items;
  }, [newsletter]);

  const metaData = useMemo(() => {
    const metaDrift = computeMetaDrift(arenaHistory);
    const metaEntries = Object.entries(metaDrift)
      .filter(([, v]) => v !== 0)
      .sort(([, a], [, b]) => b - a);
    return { metaDrift, metaEntries, topStyle: metaEntries[0] ?? null };
  }, [arenaHistory]);

  const rivalMap = useMemo(() => {
    const map = new Map<string, string>();
    if (rivals) {
      for (const rival of rivals) {
        map.set(rival.owner.id, rival.owner.stableName);
      }
    }
    return map;
  }, [rivals]);

  return {
    rivals,
    rivalPerformance,
    seasonGazette,
    metaData,
    grudges: ownerGrudges ?? [],
    rivalMap,
    season,
  };
}
