/**
 * Strategy Validation System
 * Validates and adjusts fight plans to meet minimum strategy score thresholds.
 */
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import { computeStrategyScore } from '@/engine/strategyAnalysis';

const MIN_SCORE = 50;
const MAX_RETRIES = 3;

/**
 * Validates and adjusts a fight plan to ensure it meets minimum strategy score.
 * Uses retry logic to iteratively improve plan parameters.
 *
 * @param plan - The plan to validate and adjust (mutated in place)
 * @param warrior - The warrior the plan is for
 * @returns The final strategy score after validation
 */
export function validateAndAdjustPlan(plan: FightPlan, warrior: Warrior): number {
  let retries = 0;
  let score = computeStrategyScore(plan, warrior);

  while (score < MIN_SCORE && retries < MAX_RETRIES) {
    // Adjust plan parameters to improve score
    // Reduce over-exertion if that's the issue
    const totalEffort = plan.OE + plan.AL;
    if (totalEffort > 16) {
      plan.OE = Math.max(1, plan.OE - 1);
      plan.AL = Math.max(1, plan.AL - 1);
    }
    // Increase effort if too low
    else if (totalEffort < 6) {
      plan.OE = Math.min(10, plan.OE + 1);
      plan.AL = Math.min(10, plan.AL + 1);
    }
    // Adjust towards balanced effort
    else {
      const avgEffort = Math.floor(totalEffort / 2);
      plan.OE = Math.max(1, Math.min(10, avgEffort));
      plan.AL = Math.max(1, Math.min(10, avgEffort));
    }

    score = computeStrategyScore(plan, warrior);
    retries++;
  }

  return score;
}
