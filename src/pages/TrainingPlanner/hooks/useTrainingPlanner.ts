import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { isActive } from '@/engine/warrior/warriorStatus';
import { defaultStylePreset } from '@/engine/bout/stylePresets';
import type { FightPlan, Warrior } from '@/types/game';

/**
 * Battle-plan workspace. PlanBuilder edits a local draft; the canonical roster
 * changes only when the player explicitly commits the reviewed orders.
 */
export function useTrainingPlanner() {
  const { roster, setState } = useGameStore(
    useShallow((s) => ({ roster: s.roster, setState: s.setState }))
  );
  const activeWarriors = roster.filter((w) => isActive(w));
  const [selectedIdState, setSelectedIdState] = useState<string | null>(
    activeWarriors[0]?.id || null
  );
  const [draft, setDraft] = useState<{ warriorId: string; plan: FightPlan } | null>(null);

  const selectedWarrior = activeWarriors.find((w) => w.id === selectedIdState);
  const committedPlan = selectedWarrior
    ? (selectedWarrior.plan ?? defaultStylePreset(selectedWarrior.style).plan)
    : undefined;
  const draftPlan = draft && draft.warriorId === selectedWarrior?.id ? draft.plan : committedPlan;
  const isDirty =
    !!draftPlan && !!committedPlan && JSON.stringify(draftPlan) !== JSON.stringify(committedPlan);

  const setSelectedId = (id: string | null) => {
    setDraft(null);
    setSelectedIdState(id);
  };

  const plansSetCount = useMemo(
    () => activeWarriors.filter((w) => w.plan).length,
    [activeWarriors]
  );

  const handlePlanChange = (newPlan: FightPlan) => {
    if (!selectedWarrior) return;
    setDraft({ warriorId: selectedWarrior.id, plan: newPlan });
  };

  const commitPlan = () => {
    if (!selectedWarrior || !draftPlan) return;
    setState((state) => {
      const index = state.roster.findIndex((w: Warrior) => w.id === selectedWarrior.id);
      const found = state.roster[index];
      if (found) found.plan = draftPlan;
    });
    setDraft(null);
  };

  const resetPlan = () => setDraft(null);

  return {
    activeWarriors,
    selectedId: selectedIdState,
    setSelectedId,
    selectedWarrior,
    plansSetCount,
    draftPlan,
    isDirty,
    handlePlanChange,
    commitPlan,
    resetPlan,
  };
}
