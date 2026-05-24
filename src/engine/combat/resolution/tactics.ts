/**
 * Resolution Tactics - Effective tactics and aggression bias
 */
import type { FightPlan } from '@/types/combat.types';
import type { OffensiveTactic, DefensiveTactic } from '@/types/shared.types';

/**
 * Resolve effective tactics.
 */
export function resolveEffectiveTactics(plan: FightPlan, phaseKey: 'opening' | 'mid' | 'late') {
  const phase = plan.phases?.[phaseKey];
  return {
    offTactic: (phase?.offensiveTactic ?? plan.offensiveTactic ?? 'none') as OffensiveTactic,
    defTactic: (phase?.defensiveTactic ?? plan.defensiveTactic ?? 'none') as DefensiveTactic,
    target: phase?.target ?? plan.target ?? 'Any',
  };
}

/**
 * Apply aggression bias.
 */
export function applyAggressionBias(aggressionBias: number): [number, number] {
  return aggressionBias > 5
    ? [(aggressionBias - 5) * 0.5, -(aggressionBias - 5) * 0.5]
    : [(aggressionBias - 5) * 0.5, (5 - aggressionBias) * 0.5];
}
