import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { findWarrior } from '@/engine/core/historyResolver';
import { obfuscateWarrior } from '@/lib/obfuscation';
import { type FightPlan } from '@/types/game';
import type { GameState, Warrior } from '@/types/state.types';
import type { EquipmentLoadout } from '@/data/equipment';
import { getCurrentArenaTitles, getPastArenaTitles } from '@/engine/championship/arenaChampionship';
import { getAllArenas } from '@/data/arenas';
import { warriorDisplayName } from '@/utils/warriorDisplay';
import { toast } from 'sonner';

/** Roster-mutation handlers bound to the viewed warrior. */
function useWarriorMutations(
  warrior: Warrior | undefined,
  setState: ReturnType<typeof useGameStore.getState>['setState'],
  retireWarrior: ReturnType<typeof useGameStore.getState>['retireWarrior'],
  navigate: ReturnType<typeof useNavigate>
) {
  const updateRosterWarrior = useCallback(
    (id: string, mutate: (w: Warrior) => void) => {
      setState((draft) => {
        const target = draft.roster.find((w: Warrior) => w.id === id);
        if (target) mutate(target);
      });
    },
    [setState]
  );

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      updateRosterWarrior(warrior.id, (w) => {
        w.plan = newPlan;
      });
    },
    [warrior, updateRosterWarrior]
  );

  const handleRetire = useCallback(() => {
    if (!warrior) return;
    retireWarrior(warrior.id);
    toast.success(`${warriorDisplayName(warrior)} has been granted the rudis — free at last.`);
    navigate({ to: '/' });
  }, [warrior, retireWarrior, navigate]);

  const handleEquipmentChange = useCallback(
    (newLoadout: EquipmentLoadout) => {
      if (!warrior) return;
      updateRosterWarrior(warrior.id, (w) => {
        w.equipment = newLoadout;
      });
    },
    [warrior, updateRosterWarrior]
  );

  return { handlePlanChange, handleRetire, handleEquipmentChange };
}

function useWarriorIdentity(props: {
  id: string;
  insightTokens: ReturnType<typeof useGameStore.getState>['insightTokens'];
}) {
  const { id, insightTokens } = props;
  // Atomic selectors on the shared entity index — O(1) lookups, no
  // per-render map build, and no fresh-literal cache misses.
  const warrior = useGameStore((s) => findWarrior(s, id));
  const isPlayerOwned = useGameStore(
    (s) =>
      s.roster.some((w) => w.id === id) ||
      s.graveyard.some((w) => w.id === id) ||
      s.retired.some((w) => w.id === id)
  );
  const displayWarrior = useMemo(() => {
    if (!warrior) return null;
    return obfuscateWarrior(warrior, insightTokens, isPlayerOwned);
  }, [warrior, insightTokens, isPlayerOwned]);
  return { warrior, isPlayerOwned, displayWarrior };
}

function useArenaCrowns(id: string, arenaChampions: GameState['arenaChampions']) {
  return useMemo(() => {
    if (!id) return { current: [] as string[], past: [] as string[] };
    const state = { arenaChampions } as GameState;
    const nameOf = (arenaId: string) =>
      getAllArenas().find((a) => a.id === arenaId)?.name ?? arenaId;
    return {
      current: getCurrentArenaTitles(state, id).map(nameOf),
      past: getPastArenaTitles(state, id).map((p) => nameOf(p.arenaId)),
    };
  }, [id, arenaChampions]);
}

/** Store slice for the warrior detail page. */
function useWarriorDetailStore() {
  return useGameStore(
    useShallow((s) => ({
      arenaHistory: s.arenaHistory,
      arenaChampions: s.arenaChampions,
      insightTokens: s.insightTokens,
      setState: s.setState,
      retireWarrior: s.retireWarrior,
    }))
  );
}

/**
 *
 */
export function useWarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  const {
    arenaHistory,
    arenaChampions,
    insightTokens,
    setState,
    retireWarrior,
  } = useWarriorDetailStore();

  const [activeTab, setActiveTab] = useState('biometrics');
  const { warrior, isPlayerOwned, displayWarrior } = useWarriorIdentity({
    id,
    insightTokens,
  });
  const arenaCrowns = useArenaCrowns(id, arenaChampions);

  const { handlePlanChange, handleRetire, handleEquipmentChange } = useWarriorMutations(
    warrior,
    setState,
    retireWarrior,
    navigate
  );

  return {
    id,
    warrior,
    displayWarrior,
    isPlayerOwned,
    activeTab,
    setActiveTab,
    arenaHistory,
    arenaCrowns,
    insightTokens,
    handlePlanChange,
    handleRetire,
    handleEquipmentChange,
  };
}
