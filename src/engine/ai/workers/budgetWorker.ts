import type { RivalStableData, AIEvent, GameState } from '@/types/state.types';
import { isActive } from '@/engine/warrior/warriorStatus';
import { competenceReserveScale } from '../competence';
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
/**
 * Defines the shape of budget report.
 */
interface BudgetReport {
  isAffordable: boolean;
  riskTier: AIEvent['riskTier'];
  adjustedTreasury: number;
}

/** Minimum liquid reserve regardless of roster size. */
export const BASE_RESERVE = 300;

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
 * Multi-week cash-flow forecast (Stage C): recurring upkeep every week of
 * the horizon plus one-time committed purses from signed bout offers where
 * this stable is the paying side (or the proposer is unrecorded). Pure —
 * same inputs, same projection, so shards agree.
 */
interface CashFlowProjection {
  weeks: number;
  weeklyUpkeep: number;
  committedPurses: number;
  totalOutflow: number;
  /** Treasury minus the horizon's outflows — negative means insolvency. */
  projectedFloor: number;
}

/**
 * Deterministic cash-flow projection over the next `weeks`: recurring
 * upkeep plus already-committed purses vs treasury and projected income.
 */
export function projectCashFlow(
  rival: RivalStableData,
  state: GameState,
  weeks: number
): CashFlowProjection {
  const weeklyUpkeep = projectedWeeklyUpkeep(rival);
  const rosterIds = new Set(rival.roster.map((w) => w.id as string));
  let committedPurses = 0;
  for (const offer of Object.values(state.boutOffers ?? {})) {
    if (!offer || offer.status !== 'Signed') continue;
    if (offer.proposerStableId !== undefined && offer.proposerStableId !== rival.id) continue;
    if (!offer.warriorIds.some((id) => rosterIds.has(id as string))) continue;
    committedPurses += offer.purse;
  }
  const totalOutflow = weeklyUpkeep * weeks + committedPurses;
  return {
    weeks,
    weeklyUpkeep,
    committedPurses,
    totalOutflow,
    projectedFloor: (rival.treasury || 0) - totalOutflow,
  };
}

/**
 * Check budget. `opts.horizonWeeks` prices the multi-week runway against
 * `projectCashFlow` — a spend must still clear the reserve after the
 * horizon's outflows, so big buys are judged on solvency not today's cash.
 */
export function checkBudget(
  rival: RivalStableData,
  cost: number,
  _category: 'STAFF' | 'ROSTER' | 'OTHER',
  opts?: { state?: GameState; horizonWeeks?: number }
): BudgetReport {
  const personality = rival.owner.personality ?? 'Pragmatic';
  const burnRate = rival.agentMemory?.burnRate || 0;
  // Reserve scales with real projected upkeep — a bloated roster must keep
  // far more cash liquid than the old flat 300 (G15). Competence scales
  // discipline: Novices under-reserve, Masters over-reserve (Stage B).
  const reserve =
    Math.max(BASE_RESERVE, projectedWeeklyUpkeep(rival)) *
    competenceReserveScale(rival.owner);

  // ⚡ Risk-Tiered Classification
  let riskTier: AIEvent['riskTier'] = 'Low';
  if (cost > 500) riskTier = 'High';
  else if (cost > 200) riskTier = 'Medium';

  // ⚡ Personality-Based Risk Tolerance
  let tolerance = 1.0;
  if (personality === 'Aggressive') tolerance = 1.5;
  if (personality === 'Methodical') tolerance = 0.8;
  if (personality === 'Pragmatic') tolerance = 1.0;

  let availableTreasury = (rival.treasury || 0) - (reserve + burnRate);
  const horizonWeeks = opts?.horizonWeeks ?? 0;
  if (opts?.state && horizonWeeks > 0) {
    const flow = projectCashFlow(rival, opts.state, horizonWeeks);
    availableTreasury = flow.projectedFloor - reserve;
  }
  const isAffordable = cost <= availableTreasury * tolerance;

  return {
    isAffordable,
    riskTier,
    adjustedTreasury: isAffordable ? (rival.treasury || 0) - cost : rival.treasury || 0,
  };
}
