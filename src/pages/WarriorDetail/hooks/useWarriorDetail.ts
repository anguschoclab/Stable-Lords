import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  useWarriorDetailStore,
  useWarriorIdentity,
  useArenaCrowns,
  useWarriorMutations,
} from './useWarriorSelectors';

/**
 *
 */
export function useWarriorDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();

  const { arenaHistory, arenaChampions, insightTokens, setState, retireWarrior } =
    useWarriorDetailStore();

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
