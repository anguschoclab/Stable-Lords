import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/state/useGameStore';
import { FightingStyle, STYLE_DISPLAY_NAMES } from '@/types/shared.types';
import { generateRecommendations, getStyleEquipmentTips } from '@/engine/equipmentOptimizer';
import { toast } from 'sonner';

/**
 *
 */
export function useStableEquipment() {
  const { roster, updateWarriorEquipment } = useGameStore(
    useShallow((s) => ({ roster: s.roster, updateWarriorEquipment: s.updateWarriorEquipment }))
  );
  const activeWarriors = roster.filter((w) => w.status === 'Active');

  const [selectedStyle, setSelectedStyle] = useState<FightingStyle>(
    activeWarriors[0]?.style ?? FightingStyle.StrikingAttack
  );
  const [targetWarriorId, setTargetWarriorId] = useState<string>(
    activeWarriors.find((w) => w.style === selectedStyle)?.id ?? ''
  );

  const carryCap = 12;
  const recs = useMemo(() => generateRecommendations(selectedStyle, carryCap), [selectedStyle]);
  const tips = useMemo(() => getStyleEquipmentTips(selectedStyle), [selectedStyle]);

  const targetWarrior = useMemo(
    () => activeWarriors.find((w) => w.id === targetWarriorId),
    [activeWarriors, targetWarriorId]
  );

  const handleApply = (loadout: import('@/data/equipment').EquipmentLoadout, label: string) => {
    if (!targetWarriorId) {
      toast.error('Select a warrior first');
      return;
    }
    updateWarriorEquipment(targetWarriorId as import('@/types/shared.types').WarriorId, loadout);
    toast.success(`Applied ${label} loadout to ${targetWarrior?.name}`);
  };

  const handleStyleChange = (style: FightingStyle) => {
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
    setTargetWarriorId,
    handleApply,
  };
}
