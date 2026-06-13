import { useMemo, useState } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { filterActive } from '@/utils/roster';
import type { Attributes } from '@/types/shared.types';
import type { SeasonalGrowth } from '@/types/state.types';
import { computeTrainability } from '@/engine/training/burnAnalysis';

export function useTrainingPlanner() {
  const { roster, trainers, seasonalGrowth, season } = useGameStore();
  const activeWarriors = filterActive(roster);
  const [selectedId, setSelectedId] = useState<string | null>(activeWarriors[0]?.id || null);

  const currentTrainers = useMemo(() => trainers ?? [], [trainers]);
  const selectedWarrior = activeWarriors.find((w) => w.id === selectedId);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    const growth = (seasonalGrowth ?? []) as SeasonalGrowth[];
    for (const sg of growth) {
      if (sg.season === season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [seasonalGrowth, season]);

  const avgTrainability = useMemo(() => {
    if (activeWarriors.length === 0) return 0;
    return Math.round(
      activeWarriors.reduce((s, w) => s + computeTrainability(w, currentTrainers), 0) /
        activeWarriors.length
    );
  }, [activeWarriors, currentTrainers]);

  return {
    activeWarriors,
    selectedId,
    setSelectedId,
    selectedWarrior,
    currentTrainers,
    seasonalGainsMap,
    avgTrainability,
  };
}
