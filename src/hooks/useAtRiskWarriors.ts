import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { isExhausted } from '@/engine/core/fatigueUtils';

/**
 *
 */
export interface AtRiskWarrior {
  id: string;
  name: string;
  fatigue: number;
  injuries: { name: string }[] | string[];
}

/**
 *
 */
export function useAtRiskWarriors() {
  const roster = useGameStore((s) => s.roster);

  return useMemo(() => {
    const result: AtRiskWarrior[] = [];
    for (const w of roster) {
      if (w.status !== 'Active') continue;
      const fatigue = w.fatigue ?? 0;
      if (isExhausted(fatigue) || w.injuries.length > 0) {
        result.push({
          id: w.id,
          name: w.name,
          fatigue: w.fatigue ?? 0,
          injuries: w.injuries,
        });
      }
    }
    result.sort((a, b) => b.fatigue - a.fatigue);
    return result;
  }, [roster]);
}
