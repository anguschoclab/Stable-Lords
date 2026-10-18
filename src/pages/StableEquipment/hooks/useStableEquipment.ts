import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import {
  generateRecommendations,
  getStyleEquipmentTips,
} from '@/engine/equipment/equipmentOptimizer';
import { toast } from 'sonner';
import { isActive } from '@/engine/warrior/warriorStatus';
import {
  checkWeaponRequirements,
  validateLoadout,
  type EquipmentLoadout,
} from '@/data/equipment';

function usePendingLoadout(props: {
  activeWarriors: ReturnType<typeof useGameStore.getState>['roster'];
  targetWarriorId: string;
  updateWarriorEquipment: ReturnType<typeof useGameStore.getState>['updateWarriorEquipment'];
}) {
  const { activeWarriors, targetWarriorId, updateWarriorEquipment } = props;
  const targetWarrior = useMemo(
    () => activeWarriors.find((w) => w.id === targetWarriorId),
    [activeWarriors, targetWarriorId]
  );
  const [pendingLoadout, setPendingLoadout] = useState<{
    loadout: EquipmentLoadout;
    label: string;
  } | null>(null);

  const handleApply = (loadout: EquipmentLoadout, label: string) => {
    if (!targetWarriorId) {
      toast.error('Select a warrior first');
      return;
    }
    setPendingLoadout({ loadout, label });
  };

  const commitLoadout = () => {
    if (!pendingLoadout || !targetWarrior) return;
    const issues = validateLoadout(pendingLoadout.loadout);
    const reqCheck = checkWeaponRequirements(
      pendingLoadout.loadout.weapon,
      targetWarrior.attributes
    );
    if (issues.length > 0 || !reqCheck.met) {
      toast.error(issues[0]?.message ?? 'Warrior does not meet the weapon requirements.');
      return;
    }
    updateWarriorEquipment(
      targetWarriorId as import('@/types/shared.types').WarriorId,
      pendingLoadout.loadout
    );
    toast.success(`Applied ${pendingLoadout.label} loadout to ${targetWarrior.name}`);
    setPendingLoadout(null);
  };

  const cancelLoadout = () => setPendingLoadout(null);
  const clearPendingLoadout = () => setPendingLoadout(null);

  return {
    targetWarrior,
    pendingLoadout,
    handleApply,
    commitLoadout,
    cancelLoadout,
    clearPendingLoadout,
  };
}

/**
 *
 */
export function useStableEquipment() {
  const { roster, updateWarriorEquipment } = useGameStore(
    useShallow((s) => ({ roster: s.roster, updateWarriorEquipment: s.updateWarriorEquipment }))
  );
  const activeWarriors = roster.filter((w) => isActive(w));

  const [selectedStyle, setSelectedStyle] = useState<FightingStyle>(
    activeWarriors[0]?.style ?? FightingStyle.StrikingAttack
  );
  const [targetWarriorId, setTargetWarriorId] = useState<string>(
    activeWarriors.find((w) => w.style === selectedStyle)?.id ?? ''
  );

  const carryCap = 12;
  const recs = useMemo(() => generateRecommendations(selectedStyle, carryCap), [selectedStyle]);
  const tips = useMemo(() => getStyleEquipmentTips(selectedStyle), [selectedStyle]);

  const {
    targetWarrior,
    pendingLoadout,
    handleApply,
    commitLoadout,
    cancelLoadout,
    clearPendingLoadout,
  } = usePendingLoadout({ activeWarriors, targetWarriorId, updateWarriorEquipment });

  const selectTargetWarrior = (id: string) => {
    clearPendingLoadout();
    setTargetWarriorId(id);
  };

  const handleStyleChange = (style: FightingStyle) => {
    clearPendingLoadout();
    setSelectedStyle(style);
    const firstMatch = activeWarriors.find((w) => w.style === style);
    if (firstMatch) setTargetWarriorId(firstMatch.id);
  };

  return {
    activeWarriors,
    selectedStyle,
    targetWarriorId,
    targetWarrior,
    carryCap,
    recs,
    tips,
    styleEntries: Object.entries(STYLE_DISPLAY_NAMES),
    handleStyleChange,
    setTargetWarriorId: selectTargetWarrior,
    handleApply,
    pendingLoadout,
    commitLoadout,
    cancelLoadout,
  };
}
