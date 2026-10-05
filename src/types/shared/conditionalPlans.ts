import type { FightPlan } from './fightPlan';

/**
 * Condition trigger type type.
 */
export type ConditionTriggerType =
  | 'HP_BELOW'
  | 'HP_ABOVE'
  | 'MOMENTUM_LEAD'
  | 'MOMENTUM_DEFICIT'
  | 'PHASE_IS'
  | 'ENDURANCE_BELOW'
  | 'OPPONENT_HP_BELOW'
  | 'OPPONENT_ENDURANCE_BELOW'
  | 'OPPONENT_MOMENTUM_LEAD'
  | 'OPPONENT_TACTIC_STREAK'
  | 'PSYCH_IS';

/**
 * Defines the shape of plan condition.
 */
export interface PlanCondition {
  id?: string;
  trigger: { type: ConditionTriggerType; value: number | string };
  override: Partial<
    Pick<FightPlan, 'OE' | 'AL' | 'killDesire' | 'offensiveTactic' | 'defensiveTactic'>
  >;
  label?: string;
}

/**
 * Psych state type.
 */
export type PsychState =
  'Neutral' | 'InTheZone' | 'Rattled' | 'Desperate' | 'Cruising' | 'FatiguePanic';
