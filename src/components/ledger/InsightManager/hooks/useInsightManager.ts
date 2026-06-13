import React, { useState } from 'react';
import type { InsightId, WarriorId } from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

export interface UseInsightManagerDeps {
  consumeInsightToken: (tokenId: InsightId, warriorId: WarriorId) => void;
  insightTokens: InsightToken[];
  roster: Warrior[];
}

export function useInsightManager({
  consumeInsightToken,
  insightTokens,
  roster,
}: UseInsightManagerDeps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedWarriorId, setSelectedWarriorId] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const [revealData, setRevealData] = useState<{
    name: string;
    type: string;
    result: string;
  } | null>(null);

  const tokens = insightTokens ?? [];
  const safeRoster = roster ?? [];

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);
  const selectedWarrior = safeRoster.find((w) => w.id === selectedWarriorId);

  const handleReveal = () => {
    if (!selectedToken || !selectedWarrior) return;

    setIsRevealing(true);

    timerRef.current = setTimeout(() => {
      const type = selectedToken.type;
      let result = 'Unknown';

      if (type === 'Weapon') {
        result = selectedWarrior.favorites?.weaponId || 'Gladius';
      } else if (type === 'Rhythm') {
        const r = selectedWarrior.favorites?.rhythm || { oe: 5, al: 5 };
        result = `OE:${r.oe} / AL:${r.al}`;
      } else if (type === 'Style') {
        result = '+1 ATT Permanently Applied';
      } else if (type === 'Attribute') {
        result = 'Primary Attribute Enhanced (+1)';
      } else if (type === 'Tactic') {
        result = 'Tactical Insight Unlocked';
      }

      setRevealData({
        name: selectedWarrior.name,
        type: type,
        result: result,
      });

      consumeInsightToken(selectedToken.id, selectedWarrior.id);
      setIsRevealing(false);
      setSelectedTokenId(null);
      setSelectedWarriorId(null);
    }, 2000);
  };

  return {
    tokens,
    safeRoster,
    selectedTokenId,
    setSelectedTokenId,
    selectedWarriorId,
    setSelectedWarriorId,
    selectedToken,
    selectedWarrior,
    isRevealing,
    revealData,
    setRevealData,
    handleReveal,
  };
}
