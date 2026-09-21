import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
import { TRAINER_WEEKLY_SALARY } from '@/engine/trainers';
import { TRAINER_SALARY_FALLBACK } from '@/constants/economy';
import type { Trainer } from '@/types/game';

/**
 *
 */
export function getSalary(tier: Trainer['tier']): number {
  return TRAINER_WEEKLY_SALARY[tier] ?? TRAINER_SALARY_FALLBACK;
}

/**
 *
 */
export function useContractData() {
  const trainers = useGameStore((s) => s.trainers);

  // ⚡ Bolt: Consolidated multiple array passes (.filter, .reduce) into a single loop
  // and wrapped in useMemo to prevent recalculation on unrelated re-renders.
  return useMemo(() => {
    const safeTrainers = trainers ?? [];
    const activeTrainers: Trainer[] = [];
    let totalWeeklyExpense = 0;
    let expiringSoonCount = 0;

    for (let i = 0; i < safeTrainers.length; i++) {
      const t = safeTrainers[i];
      if (t && t.contractWeeksLeft > 0) {
        activeTrainers.push(t);
        totalWeeklyExpense += getSalary(t.tier);
        if (t.contractWeeksLeft <= 4) {
          expiringSoonCount++;
        }
      }
    }

    return { activeTrainers, totalWeeklyExpense, expiringSoonCount };
  }, [trainers]);
}
