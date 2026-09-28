import React, { useState } from 'react';
import type { InsightId, WarriorId } from '@/types/shared.types';
import type { InsightToken } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

/**
 *
 */
export interface UseInsightManagerDeps {
  consumeInsightToken: (tokenId: InsightId, warriorId: WarriorId) => void;
  insightTokens: InsightToken[];
  roster: Warrior[];
}

/**
 *
 */
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

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsRevealing(true);

    timerRef.current = setTimeout(() => {
      const result = resolveInsightResult(selectedToken, selectedWarrior);

      setRevealData({
        name: selectedWarrior.name,
        type: selectedToken.type,
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

/** Human-readable reveal result for the token type against this warrior. */
function resolveInsightResult(token: InsightToken, warrior: Warrior): string {
  const type = token.type;
  if (type === 'Weapon') return warrior.favorites?.weaponId || 'Gladius';
  if (type === 'Rhythm') {
    const r = warrior.favorites?.rhythm || { oe: 5, al: 5 };
    return `OE:${r.oe} / AL:${r.al}`;
  }
  if (type === 'Style') return '+1 ATT Permanently Applied';
  if (type === 'Attribute') return 'Primary Attribute Enhanced (+1)';
  if (type === 'Tactic') return 'Tactical Insight Unlocked';
  return 'Unknown';
}
