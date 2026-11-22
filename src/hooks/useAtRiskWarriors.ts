import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { isExhausted } from '@/engine/core/fatigueUtils';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { isActive } from '@/engine/warrior/warriorStatus';

/** Minimal projection of a warrior flagged at-risk (fatigue/injury). */
export interface AtRiskWarrior {
  id: string;
  name: string;
  epithet?: string;
  fatigue: number;
  injuries: { name: string }[] | string[];
}

/** Active warriors who are exhausted or injured, sorted by fatigue desc. */
export function useAtRiskWarriors() {
  const roster = useGameStore((s) => s.roster);

  return useMemo(() => {
    const result: AtRiskWarrior[] = [];
    for (const w of roster) {
      if (!isActive(w)) continue;
      const fatigue = w.fatigue ?? 0;
      if (isExhausted(fatigue) || w.injuries.length > 0) {
        result.push({
          id: w.id,
          name: w.name,
          epithet: w.epithet,
          fatigue: w.fatigue ?? 0,
          injuries: w.injuries,
        });
      }
    }
    result.sort((a, b) => b.fatigue - a.fatigue);
    return result;
  }, [roster]);
}
