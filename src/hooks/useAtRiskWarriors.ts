import { useGameStore } from '@/state/useGameStore';
import { useShallow } from 'zustand/react/shallow';

export interface AtRiskWarrior {
  id: string;
  name: string;
  fatigue: number;
  injuries: { name: string }[] | string[];
}

export function useAtRiskWarriors() {
  return useGameStore(
    useShallow((s) => {
      const result: AtRiskWarrior[] = [];
      for (const w of s.roster) {
        const fatigue = w.fatigue ?? 0;
        if (w.status === 'Active' && (fatigue > 60 || w.injuries.length > 0)) {
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
