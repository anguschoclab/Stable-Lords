import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { isExhausted } from '@/utils/fatigueUtils';
import { filterActive } from '@/utils/roster';

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
  return useGameStore(
    useShallow((s) => {
      const result: AtRiskWarrior[] = [];
      for (const w of filterActive(s.roster)) {
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
    })
  );
}
