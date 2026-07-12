import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';

export function useTrainingPlanner() {
  const { roster, setState } = useGameStore(
    useShallow((s) => ({ roster: s.roster, setState: s.setState }))
  );
  const activeWarriors = roster.filter((w) => w.status === 'Active');
  const [selectedId, setSelectedId] = useState<string | null>(activeWarriors[0]?.id || null);

  const selectedWarrior = activeWarriors.find((w) => w.id === selectedId);

  const plansSetCount = useMemo(
    () => activeWarriors.filter((w) => w.plan).length,
    [activeWarriors]
  );

  return {
    activeWarriors,
    selectedId,
    setSelectedId,
    selectedWarrior,
    setState,
    plansSetCount,
  };
}
