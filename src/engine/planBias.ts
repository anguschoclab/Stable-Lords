/**
 * Plan bias + style-aware auto-tune helpers.
 */
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/combat.types';/**
 * Bias type.
 */


/**
 * Bias type.
 */
export type Bias = 'head-hunt' | 'hamstring' | 'gut' | 'guard-break' | 'balanced';/**
 * Auto tune from bias.
 * @param plan - Plan.
 * @param bias - Bias.
 * @returns The result.
 */


/**
 * Auto tune from bias.
 * @param plan - Plan.
 * @param bias - Bias.
 * @returns The result.
 */
export function autoTuneFromBias(plan: FightPlan, bias: Bias): Partial<FightPlan> {
  const tuned: Partial<FightPlan> = {};

  switch (bias) {
    case 'head-hunt':
      tuned.target = 'Head';
      tuned.killDesire = Math.max(7, plan.killDesire ?? 7);
      break;
    case 'hamstring':
      tuned.target = 'Right Leg';
      tuned.AL = Math.max(plan.AL, 7);
      break;
    case 'gut':
      tuned.target = 'Abdomen';
      tuned.OE = Math.max(plan.OE, 7);
      break;
    case 'guard-break':
      tuned.target = 'Right Arm';
      tuned.OE = Math.max(plan.OE, 8);
      break;
    default:
      tuned.target = 'Any';
  }

  // Style nudges
  if (plan.style === FightingStyle.LungingAttack || plan.style === FightingStyle.ParryLunge)
    tuned.offensiveTactic = 'Lunge';
  if (plan.style === FightingStyle.BashingAttack)
    tuned.offensiveTactic = tuned.offensiveTactic || 'Bash';
  if (plan.style === FightingStyle.ParryRiposte) tuned.defensiveTactic = 'Riposte';
  if (plan.style === FightingStyle.TotalParry) tuned.defensiveTactic = 'Parry';

  return tuned;
}/**
 * Reconcile gear two handed.
 * @param plan - Plan.
 * @param draft - Draft.
 * @returns The result.
 */


/**
 * Reconcile gear two handed.
 * @param plan - Plan.
 * @param draft - Draft.
 * @returns The result.
 */
export function reconcileGearTwoHanded(plan: FightPlan, draft: Partial<FightPlan>): void {
  const next = { ...plan, ...draft };
  if (next.gear?.weapon?.twoHanded && next.gear?.shield && next.gear.shield !== 'None') {
    draft.gear = { ...next.gear, shield: 'None' };
  }
}
