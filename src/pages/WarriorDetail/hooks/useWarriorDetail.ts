import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { buildWarriorMap } from '@/utils/warriorCollection';
import { obfuscateWarrior } from '@/lib/obfuscation';
import { type FightPlan } from '@/types/game';
import type { Warrior } from '@/types/state.types';
import type { EquipmentLoadout } from '@/data/equipment';
import { toast } from 'sonner';

export function useWarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  const {
    roster,
    graveyard,
    retired,
    rivals,
    arenaHistory,
    insightTokens,
    setState,
    retireWarrior,
  } = useGameStore(
    useShallow((s) => ({
      roster: s.roster,
      graveyard: s.graveyard,
      retired: s.retired,
      rivals: s.rivals,
      arenaHistory: s.arenaHistory,
      insightTokens: s.insightTokens,
      setState: s.setState,
      retireWarrior: s.retireWarrior,
    }))
  );

  const [activeTab, setActiveTab] = useState('biometrics');

  const { warrior, isPlayerOwned } = useMemo(() => {
    const allMap = buildWarriorMap({ roster, graveyard, retired, rivals });
    const playerIds = new Set<string>();
    for (const w of roster) playerIds.add(w.id);
    for (const w of graveyard) playerIds.add(w.id);
    for (const w of retired) playerIds.add(w.id);

    const found = allMap.get(id);
    return { warrior: found, isPlayerOwned: found ? playerIds.has(id) : false };
  }, [id, roster, graveyard, retired, rivals]);

  const displayWarrior = useMemo(() => {
    if (!warrior) return null;
    return obfuscateWarrior(warrior, insightTokens, isPlayerOwned);
  }, [warrior, insightTokens, isPlayerOwned]);

  const handlePlanChange = useCallback(
    (newPlan: FightPlan) => {
      if (!warrior) return;
      setState((draft) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === warrior.id);
        const found = draft.roster[index];
        if (found) {
          found.plan = newPlan;
        }
      });
    },
    [warrior, setState]
  );

  const handleRetire = useCallback(() => {
    if (!warrior) return;
    retireWarrior(warrior.id);
    toast.success(`${warrior.name} has been granted the rudis — free at last.`);
    navigate({ to: '/' });
  }, [warrior, retireWarrior, navigate]);

  const handleEquipmentChange = useCallback(
    (newLoadout: EquipmentLoadout) => {
      if (!warrior) return;
      setState((draft) => {
        const index = draft.roster.findIndex((w: Warrior) => w.id === warrior.id);
        const found = draft.roster[index];
        if (found) {
          found.equipment = newLoadout;
        }
      });
    },
    [warrior, setState]
  );

  return {
    id,
    warrior,
    displayWarrior,
    isPlayerOwned,
    activeTab,
    setActiveTab,
    arenaHistory,
    insightTokens,
    handlePlanChange,
    handleRetire,
    handleEquipmentChange,
  };
}
