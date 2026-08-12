import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { isActive } from '@/engine/warriorStatus';
import type { FightPlan, Warrior } from '@/types/game';

/**
 *
 */
export function useTrainingPlanner() {
  const { roster, setState } = useGameStore(
    useShallow((s) => ({ roster: s.roster, setState: s.setState }))
  );
  const activeWarriors = roster.filter((w) => isActive(w));
  const [selectedId, setSelectedId] = useState<string | null>(activeWarriors[0]?.id || null);

  const selectedWarrior = activeWarriors.find((w) => w.id === selectedId);

  const plansSetCount = useMemo(
    () => activeWarriors.filter((w) => w.plan).length,
    [activeWarriors]
  );

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!selectedWarrior) return;
      setState((draft) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === selectedWarrior.id);
        const found = draft.roster[index];
        if (found) found.plan = newPlan;
      });
    },
    [selectedWarrior, setState]
  );

  return {
    activeWarriors,
    selectedId,
    setSelectedId,
    selectedWarrior,
    plansSetCount,
    handlePlanChange,
  };
}
