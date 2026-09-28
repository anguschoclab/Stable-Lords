import { useMemo } from 'react';
import { toast } from 'sonner';
import { useGameStore, useWorldState, type GameStore } from '@/state/useGameStore';
import { ATTRIBUTE_LABELS, type TrainingAssignment, type Attributes } from '@/types/game';
import type { WarriorId } from '@/types/shared.types';
import { TRAIT_TRAIN_WEEKS } from '@/engine/training/trainingGains/traitTraining';

/** Derived lookup maps: assignment, seasonal gains, and roster names. */
function useAssignmentMaps(state: ReturnType<typeof useWorldState>) {
  const assignmentMap = useMemo(() => {
    const map = new Map<string, TrainingAssignment>();
    for (const a of state.trainingAssignments ?? []) map.set(a.warriorId, a);
    return map;
  }, [state.trainingAssignments]);

  const seasonalGainsMap = useMemo(() => {
    const map = new Map<string, Partial<Record<keyof Attributes, number>>>();
    for (const sg of state.seasonalGrowth ?? []) {
      if (sg.season === state.season) {
        map.set(sg.warriorId, sg.gains);
      }
    }
    return map;
  }, [state.seasonalGrowth, state.season]);

  const rosterNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of state.roster ?? []) {
      map.set(w.id, w.name);
    }
    return map;
  }, [state.roster]);

  return { assignmentMap, seasonalGainsMap, rosterNameMap };
}

/** Assign/clear mutations with their confirmation toasts. */
function useAssignmentMutations(
  setState: GameStore['setState'],
  rosterNameMap: Map<string, string>
) {
  const replaceAssignment = (warriorId: WarriorId, next: TrainingAssignment) =>
    setState((s: GameStore) => {
      s.trainingAssignments = [
        ...(s.trainingAssignments ?? []).filter(
          (a: TrainingAssignment) => a.warriorId !== warriorId
        ),
        next,
      ];
    });

  const handleAssign = (warriorId: WarriorId, attribute: keyof Attributes) => {
    if (attribute === 'SZ') return;
    replaceAssignment(warriorId, { warriorId, type: 'attribute', attribute });
    toast.success(
      `${rosterNameMap.get(warriorId) ?? 'Warrior'} assigned to train ${ATTRIBUTE_LABELS[attribute]}`
    );
  };

  const handleAssignRecovery = (warriorId: WarriorId) => {
    replaceAssignment(warriorId, { warriorId, type: 'recovery' });
    toast.success(`${rosterNameMap.get(warriorId) ?? 'Warrior'} assigned to active recovery`);
  };

  const handleAssignTraitTraining = (warriorId: WarriorId, trainerId: string) => {
    replaceAssignment(warriorId, {
      warriorId,
      type: 'trait' as const,
      trainerId,
      weeksRemaining: TRAIT_TRAIN_WEEKS,
    });
    toast.success('Trait training assigned — outcome in a few weeks.');
  };

  const handleClear = (warriorId: WarriorId) => {
    setState((s: GameStore) => {
      s.trainingAssignments = (s.trainingAssignments ?? []).filter(
        (a: TrainingAssignment) => a.warriorId !== warriorId
      );
    });
  };

  const handleClearAll = () => {
    setState((s: GameStore) => {
      s.trainingAssignments = [];
    });
    toast('All training assignments cleared.');
  };

  return { handleAssign, handleAssignRecovery, handleAssignTraitTraining, handleClear, handleClearAll };
}

/**
 * Training-assignment state and handlers: per-warrior assignment map,
 * seasonal-gain map, and the assign/clear mutations with their toasts.
 */
export function useTrainingAssignments() {
  const state = useWorldState();
  const setState = useGameStore((s) => s.setState);

  const { assignmentMap, seasonalGainsMap, rosterNameMap } = useAssignmentMaps(state);
  const mutations = useAssignmentMutations(setState, rosterNameMap);

  const assignments = state.trainingAssignments ?? [];

  const assignedCount = assignments.length;
  const recoveryCount = assignments.filter(
    (a: TrainingAssignment) => a.type === 'recovery'
  ).length;
  const trainingCount = assignedCount - recoveryCount;

  return {
    assignmentMap,
    seasonalGainsMap,
    assignments,
    assignedCount,
    recoveryCount,
    trainingCount,
    ...mutations,
  };
}
