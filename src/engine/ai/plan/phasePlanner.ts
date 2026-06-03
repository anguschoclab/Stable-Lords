/**
 * Phase Planning System
 * Builds per-phase strategies and desperate fallback plans for AI warriors.
 */
import { FightingStyle } from '@/types/shared.types';
import type { PlanCondition } from '@/types/shared.types';
import type { OwnerPersonality } from '@/types/state.types';
import type { FightPlan, PhaseStrategy } from '@/types/combat.types';
import { clamp } from '@/utils/math';

/**
 * Build per-phase OE/AL curves: conservative opening, base mid, personality-tweaked late.
 *
 * @param plan - The base fight plan
 * @param personality - Owner personality for late phase modifiers
 * @param style - Fighting style to determine opening bias
 * @returns Phased strategies for the bout
 */
export function buildPhasePlan(
  plan: FightPlan,
  personality: OwnerPersonality,
  style: FightingStyle
): FightPlan['phases'] {
  const isDefensive =
    style === FightingStyle.TotalParry ||
    style === FightingStyle.WallOfSteel ||
    style === FightingStyle.ParryRiposte;
  const openingOE = clamp(plan.OE - (isDefensive ? 2 : 1), 1, 10);
  // Aggression bias ramps across the bout: feel the opponent out, then open up late.
  const baseBias = plan.aggressionBias ?? 5;
  const opening: PhaseStrategy = {
    OE: openingOE,
    AL: plan.AL,
    killDesire: Math.max(1, (plan.killDesire ?? 5) - 1),
    aggressionBias: clamp(baseBias - 1, 0, 10),
  };
  const mid: PhaseStrategy = {
    OE: plan.OE,
    AL: plan.AL,
    killDesire: plan.killDesire ?? 5,
    aggressionBias: baseBias,
  };
  const lateOE =
    personality === 'Aggressive' || personality === 'Showman'
      ? clamp(plan.OE + 1, 1, 10)
      : personality === 'Methodical' || personality === 'Tactician'
        ? clamp(plan.OE - 1, 1, 10)
        : plan.OE;
  const lateAL =
    personality === 'Methodical' || personality === 'Tactician'
      ? clamp(plan.AL + 1, 1, 10)
      : plan.AL;
  const lateBias =
    personality === 'Aggressive' || personality === 'Showman'
      ? clamp(baseBias + 1, 0, 10)
      : baseBias;
  const late: PhaseStrategy = {
    OE: lateOE,
    AL: lateAL,
    killDesire: plan.killDesire ?? 5,
    aggressionBias: lateBias,
  };
  return { opening, mid, late };
}

/**
 * Build a personality-keyed desperate plan (HP<30% or END<20% fallback).
 *
 * @param plan - The base fight plan
 * @param personality - Owner personality for desperate logic
 * @returns A fallback strategy for critical situations
 */
export function buildDesperatePlan(
  plan: FightPlan,
  personality: OwnerPersonality
): FightPlan['desperatePlan'] {
  const baseOE = plan.OE;
  const baseAL = plan.AL;
  const baseKD = plan.killDesire ?? 5;
  if (personality === 'Aggressive') {
    return {
      OE: clamp(baseOE - 1, 1, 10),
      AL: clamp(baseAL + 1, 1, 10),
      killDesire: clamp(baseKD + 1, 1, 10),
    };
  }
  if (personality === 'Methodical') {
    return { OE: 1, AL: clamp(baseAL + 3, 1, 10), killDesire: clamp(baseKD - 2, 1, 10) };
  }
  return {
    OE: clamp(baseOE - 2, 1, 10),
    AL: clamp(baseAL + 2, 1, 10),
    killDesire: clamp(baseKD - 2, 1, 10),
  };
}

/**
 * Universal conditions prepended before personality ones (first-match-wins).
 * Ensures every AI warrior has a critical-endurance survival fallback.
 *
 * @param plan - The base fight plan
 * @returns A list of universal plan conditions
 */
export function buildUniversalConditions(plan: FightPlan): PlanCondition[] {
  const bounded = (v: number, delta: number) => clamp(v + delta, 1, 10);
  return [
    {
      trigger: { type: 'ENDURANCE_BELOW', value: 15 },
      override: { OE: bounded(plan.OE, -2), AL: bounded(plan.AL, +2) },
      label: 'Universal: critical endurance survival',
    },
  ];
}
