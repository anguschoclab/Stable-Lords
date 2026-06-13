import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { collectAllKnownWarriors, buildWarriorMap } from '@/utils/warriorCollection';
import { ArenaHistory } from '@/engine/history/arenaHistory';
import type { AnnualAward } from '@/types/game';
import type { UpsetEntry } from '@/components/awards/UpsetsList';

export function useHallOfFame() {
  const { roster, graveyard, retired, rivals, awards, year, player, season } = useGameStore();
  const allFights = useMemo(() => ArenaHistory.all(), []);

  const allWarriors = useMemo(
    () => collectAllKnownWarriors({ roster, graveyard, retired, rivals }),
    [roster, graveyard, retired, rivals]
  );
  const warriorById = useMemo(
    () => buildWarriorMap({ roster, graveyard, retired, rivals }),
    [roster, graveyard, retired, rivals]
  );

  const yearlyAwards = useMemo(() => {
    const groups: Record<number, AnnualAward[]> = {};
    for (const award of awards || []) {
      const yearGroup = groups[award.year] ?? [];
      yearGroup.push(award);
      groups[award.year] = yearGroup;
    }
    return Object.entries(groups)
      .map(([y, aws]) => ({ year: parseInt(y), awards: aws }))
      .sort((a, b) => b.year - a.year);
  }, [awards]);

  const allTimeGreats = useMemo(() => {
    return [...allWarriors]
      .filter((w) => w.career.wins + w.career.losses > 0)
      .sort((a, b) => (b.fame ?? 0) - (a.fame ?? 0))
      .slice(0, 6);
  }, [allWarriors]);

  const myFallen = graveyard.filter((w) => w.stableId === player.id);

  const fameByWarriorId = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of allWarriors) map.set(w.id, w.fame ?? 0);
    return map;
  }, [allWarriors]);

  const getFightsForYear = (yr: number) => {
    const weekStart = (yr - 1) * 52 + 1;
    const weekEnd = yr * 52;
    return allFights.filter((f) => f.week >= weekStart && f.week <= weekEnd);
  };

  const getUpsetsForYear = (yr: number): UpsetEntry[] => {
    return getFightsForYear(yr)
      .map((f) => {
        const fameA = fameByWarriorId.get(f.warriorIdA ?? '') ?? 0;
        const fameD = fameByWarriorId.get(f.warriorIdD ?? '') ?? 0;
        const n = (f.title.split(' (')[0] ?? '').split(' vs ');
        const nameA = n[0] || 'Unknown';
        const nameD = n[1] || 'Unknown';
        const winnerName = f.winner === 'A' ? nameA : nameD;
        const loserName = f.winner === 'A' ? nameD : nameA;
        const winnerFame = f.winner === 'A' ? fameA : fameD;
        const loserFame = f.winner === 'A' ? fameD : fameA;
        const fameDiff = loserFame - winnerFame;
        return { winner: winnerName, loser: loserName, by: f.by, fameDiff, week: f.week };
      })
      .filter((u) => u.fameDiff >= 10)
      .sort((a, b) => b.fameDiff - a.fameDiff)
      .slice(0, 5);
  };

  return {
    year,
    player,
    season,
    graveyard,
    myFallen,
    yearlyAwards,
    allTimeGreats,
    warriorById,
    allFights,
    getFightsForYear,
    getUpsetsForYear,
  };
}
