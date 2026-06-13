import { useGameStore } from '@/state/useGameStore';
import { TRAINER_WEEKLY_SALARY } from '@/engine/trainers';
import type { Trainer } from '@/types/game';

export function getSalary(tier: Trainer['tier']): number {
  return TRAINER_WEEKLY_SALARY[tier] ?? 35;
}

export function useContractData() {
  const trainers = useGameStore((s) => s.trainers);
  const safeTrainers = trainers ?? [];
  const activeTrainers = safeTrainers.filter((t) => t.contractWeeksLeft > 0);
  const totalWeeklyExpense = activeTrainers.reduce((sum, t) => sum + getSalary(t.tier), 0);
  const expiringSoonCount = activeTrainers.filter((t) => t.contractWeeksLeft <= 4).length;

  return { activeTrainers, totalWeeklyExpense, expiringSoonCount };
}
