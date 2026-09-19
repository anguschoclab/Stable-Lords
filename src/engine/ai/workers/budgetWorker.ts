import type { RivalStableData, AIEvent } from '@/types/state.types';
import { isActive } from '@/engine/warriorStatus';
import {
  WARRIOR_UPKEEP_BASE,
  FAME_UPKEEP_MULTIPLIER,
  TRAINING_COST,
  TRAINER_WEEKLY_SALARY,
  TRAINER_SALARY_FALLBACK,
} from '@/constants/economy';

/**
 * BudgetWorker: Handles risk-tiered spending checks.
 * Implements "Risk-Tiered Execution" and "Blocking Budgets".
 */
export type RiskLevel = 'Safe' | 'Speculative' | 'Reckless';

/**
 * Defines the shape of budget report.
 */
export interface BudgetReport {
  isAffordable: boolean;
  riskTier: AIEvent['riskTier'];
  adjustedTreasury: number;
}

/** Minimum liquid reserve regardless of roster size. */
const BASE_RESERVE = 300;

/**
 * Projected weekly upkeep for this stable using the same constants as the
 * shared EconomyPass path: per-warrior upkeep + fame premium + one training
 * session per active warrior + active trainer salaries.
 */
export function projectedWeeklyUpkeep(rival: RivalStableData): number {
  let upkeep = 0;
  let activeCount = 0;
  for (const w of rival.roster) {
    if (!isActive(w)) continue;
    activeCount++;
    upkeep += WARRIOR_UPKEEP_BASE + Math.round((w.fame ?? 0) * FAME_UPKEEP_MULTIPLIER);
  }
  upkeep += activeCount * TRAINING_COST;
  for (const t of rival.trainers ?? []) {
    if (t.contractWeeksLeft > 0) {
      upkeep += TRAINER_WEEKLY_SALARY[t.tier] ?? TRAINER_SALARY_FALLBACK;
    }
  }
  return upkeep;
}

/**
 * Check budget.
 */
export function checkBudget(
  rival: RivalStableData,
  cost: number,
  _category: 'STAFF' | 'ROSTER' | 'OTHER'
): BudgetReport {
  const personality = rival.owner.personality ?? 'Pragmatic';
  const burnRate = rival.agentMemory?.burnRate || 0;
  // Reserve scales with real projected upkeep — a bloated roster must keep
  // far more cash liquid than the old flat 300 (G15).
  const reserve = Math.max(BASE_RESERVE, projectedWeeklyUpkeep(rival));

  // ⚡ Risk-Tiered Classification
  let riskTier: AIEvent['riskTier'] = 'Low';
  if (cost > 500) riskTier = 'High';
  else if (cost > 200) riskTier = 'Medium';

  // ⚡ Personality-Based Risk Tolerance
  let tolerance = 1.0;
  if (personality === 'Aggressive') tolerance = 1.5;
  if (personality === 'Methodical') tolerance = 0.8;
  if (personality === 'Pragmatic') tolerance = 1.0;

  const availableTreasury = (rival.treasury || 0) - (reserve + burnRate);
  const isAffordable = cost <= availableTreasury * tolerance;

  return {
    isAffordable,
    riskTier,
    adjustedTreasury: isAffordable ? (rival.treasury || 0) - cost : rival.treasury || 0,
  };
}
