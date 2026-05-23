/**
 * Personality Adaptation Engine
 * Provides in-bout condition adaptations based on owner personality.
 */
import type { OwnerPersonality, AIIntent } from '@/types/state.types';
import type { PlanCondition, FightPlan } from '@/types/shared.types';
import { clamp } from '@/utils/math';

/** Function signature for per-personality in-bout adaptation builders. */
type PersonalityAdaptationFn = (
  plan: FightPlan,
  bounded: (v: number, delta: number) => number,
  isKillIntent: boolean
) => PlanCondition[];

/**
 * Strategy map: each OwnerPersonality maps to a function that builds its
 * in-bout PlanCondition nudges.  TypeScript will error if a personality is
 * ever added to the union without a corresponding entry here.
 */
export const PERSONALITY_ADAPTATION_MAP: Record<OwnerPersonality, PersonalityAdaptationFn> = {
  Aggressive: (plan, bounded, isKillIntent) => {
    const conditions: PlanCondition[] = [
      {
        trigger: { type: 'MOMENTUM_LEAD', value: 2 },
        override: { OE: bounded(plan.OE, +1), killDesire: bounded(plan.killDesire ?? 5, +1) },
        label: 'Aggressive: press the advantage',
      },
    ];
    if (isKillIntent) {
      conditions.push({
        trigger: { type: 'MOMENTUM_LEAD', value: 2 },
        override: { OE: bounded(plan.OE, +1), killDesire: bounded(plan.killDesire ?? 5, +2) },
        label: 'Aggressive+Vendetta: kill commitment',
      });
    }
    return conditions;
  },
  Methodical: (plan, bounded) => [
    {
      // Losing ground on momentum → tighten defence.
      trigger: { type: 'MOMENTUM_DEFICIT', value: 2 },
      override: { AL: bounded(plan.AL, +1), OE: bounded(plan.OE, -1) },
      label: 'Methodical: disengage and reset',
    },
  ],
  Showman: (plan, bounded) => [
    {
      // Late-phase flourish: drama sells tickets, lethality sells legends.
      trigger: { type: 'PHASE_IS', value: 'LATE' },
      override: { killDesire: bounded(plan.killDesire ?? 5, +1), OE: bounded(plan.OE, +1) },
      label: 'Showman: late-phase flourish',
    },
  ],
  Pragmatic: (plan, bounded) => [
    {
      // Below 30% HP: survive the round first, win the campaign second.
      trigger: { type: 'HP_BELOW', value: 30 },
      override: {
        OE: bounded(plan.OE, -1),
        AL: bounded(plan.AL, +2),
        killDesire: bounded(plan.killDesire ?? 5, -1),
      },
      label: 'Pragmatic: preservation',
    },
  ],
  Tactician: (plan, bounded) => [
    {
      // Endurance under 40%: conserve, outlast.
      trigger: { type: 'ENDURANCE_BELOW', value: 40 },
      override: { OE: bounded(plan.OE, -1), AL: bounded(plan.AL, +1) },
      label: 'Tactician: conserve pace',
    },
  ],
};

/**
 * Per-personality in-bout nudges. Returned as PlanConditions so they're evaluated
 * by the existing WT-gated condition pipeline — no new code path.
 *
 * @param personality - The personality to adapt for
 * @param plan - The base fight plan
 * @param intent - Current strategic intent
 * @returns A list of personality-specific conditions
 */
export function getPersonalityAdaptations(
  personality: OwnerPersonality,
  plan: FightPlan,
  intent?: AIIntent
): PlanCondition[] {
  const bounded = (v: number, delta: number) => clamp(v + delta, 1, 10);
  const isKillIntent = intent === 'VENDETTA' || intent === 'AGGRESSIVE_EXPANSION';
  const handler = PERSONALITY_ADAPTATION_MAP[personality];
  return handler ? handler(plan, bounded, isKillIntent) : [];
}
