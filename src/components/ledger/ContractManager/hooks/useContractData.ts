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

  return useMemo(() => {
    const safeTrainers = trainers ?? [];
    const activeTrainers: Trainer[] = [];
    let totalWeeklyExpense = 0;
    let expiringSoonCount = 0;

    for (const t of safeTrainers) {
      if (t.contractWeeksLeft > 0) {
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
