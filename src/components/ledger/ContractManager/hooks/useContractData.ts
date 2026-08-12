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
  const safeTrainers = trainers ?? [];
  const activeTrainers = safeTrainers.filter((t) => t.contractWeeksLeft > 0);
  const totalWeeklyExpense = activeTrainers.reduce((sum, t) => sum + getSalary(t.tier), 0);
  const expiringSoonCount = activeTrainers.filter((t) => t.contractWeeksLeft <= 4).length;

  return { activeTrainers, totalWeeklyExpense, expiringSoonCount };
}
