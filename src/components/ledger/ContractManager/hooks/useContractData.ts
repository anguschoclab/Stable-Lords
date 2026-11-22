import { useMemo } from 'react';
import { useGameStore } from '@/state/useGameStore';
// eslint-disable-next-line no-restricted-imports -- grandfathered pre-boundary-fix import
import { TRAINER_WEEKLY_SALARY } from '@/engine/trainers/trainers';
import { TRAINER_SALARY_FALLBACK } from '@/constants/economy';
import type { Trainer } from '@/types/game';

/** Weekly salary for a trainer tier, falling back when unmapped. */
export function getSalary(tier: Trainer['tier']): number {
  return TRAINER_WEEKLY_SALARY[tier] ?? TRAINER_SALARY_FALLBACK;
}

/** Active trainers, total weekly payroll, and expiring-soon count. */
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
