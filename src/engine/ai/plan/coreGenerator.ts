/**
 * AI Plan Core Generator
 * Main orchestrator for generating personality-, philosophy-, meta-, and matchup-aware fight plans.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type { OwnerPersonality, AIIntent } from '@/types/state.types';
import { defaultPlanForWarrior } from '@/engine/simulate';
import { PERSONALITY_PLAN_MODS, PHILOSOPHY_PLAN_MODS } from '@/data/ownerData';
import { clamp } from '@/utils/math';
import { getStyleMatchupMods, getStyleSuitabilityBias } from '@/engine/ai/matchup/styleMatcher';
import {
  buildPhasePlan,
  buildDesperatePlan,
  buildUniversalConditions,
} from '@/engine/ai/plan/phasePlanner';
import { getPersonalityAdaptations } from '@/engine/ai/plan/personalityEngine';
import { validateAndAdjustPlan } from '@/engine/ai/plan/strategyValidator';
import {
  getAITarget,
  getAIProtect,
  getAIAggressionBias,
  getAIOpeningMove,
  getAIRangePreference,
} from '@/engine/ai/plan/levers';
import { reconcileGearTwoHanded } from '@/engine/planBias';

/**
 * Generate a personality-, philosophy-, meta-, and matchup-aware fight plan for an AI warrior.
 * Now includes per-style matchup heuristics, global strategic intent, and strategy score validation.
 *
 * @param w - The warrior to generate a plan for
 * @param personality - Personality traits of the stable owner
 * @param philosophy - Strategic philosophy of the owner
 * @param opponentStyle - Fighting style of the opponent (optional)
 * @param intent - Current strategic intent (e.g., VENDETTA)
 * @param grudgeIntensity - Intensity of the grudge between owners
 * @returns A computed fight plan for the warrior
 */
export function aiPlanForWarrior(
  w: Warrior,
  personality: OwnerPersonality,
  philosophy: string,
  opponentStyle?: FightingStyle,
  intent?: AIIntent,
  grudgeIntensity: number = 0
): FightPlan {
  const base = defaultPlanForWarrior(w);
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};

  // Intent-based modifiers
  let intentOE = 0;
  let intentAL = 0;
  let intentKD = 0;

  if (intent === 'RECOVERY') {
    intentOE = -2; // Defensive to minimize damage
    intentAL = -1;
    intentKD = -2;
  } else if (intent === 'VENDETTA') {
    intentAL = 2; // Relentless
    intentKD = 2;
  }

  // Grudge-based escalation
  const grudgeKD = grudgeIntensity; // +1 to +5
  const grudgeAL = Math.floor(grudgeIntensity / 2);

  // Per-style matchup heuristics
  const matchup = opponentStyle
    ? getStyleMatchupMods(w.style, opponentStyle)
    : { oe: 0, al: 0, kd: 0 };

  // Generate initial plan
  const plan: FightPlan = {
    ...base,
    OE: clamp((base.OE ?? 5) + (pMod.OE ?? 0) + (phMod.OE ?? 0) + matchup.oe + intentOE, 1, 10),
    AL: clamp(
      (base.AL ?? 5) + (pMod.AL ?? 0) + (phMod.AL ?? 0) + matchup.al + intentAL + grudgeAL,
      1,
      10
    ),
    killDesire: clamp(
      (base.killDesire ?? 5) +
        (pMod.killDesire ?? 0) +
        (phMod.killDesire ?? 0) +
        matchup.kd +
        intentKD +
        grudgeKD,
      1,
      10
    ),
  };

  // Strategy score validation with retry logic
  validateAndAdjustPlan(plan, w);

  // Tactic suitability validation - adjust OE/AL based on style compatibility
  // High OE is more suitable for aggressive styles, high AL for defensive styles
  const styleSuitabilityBias = getStyleSuitabilityBias(w.style);
  plan.OE = clamp(plan.OE + styleSuitabilityBias.oe, 1, 10);
  plan.AL = clamp(plan.AL + styleSuitabilityBias.al, 1, 10);

  // Offensive/defensive tactics come from the base plan (defaultPlanForWarrior →
  // getAITactics), which assigns each style its canonical Duel II Favorite Tactics.
  // We intentionally do NOT override them here: some styles canonically run a
  // signature tactic on one side and 'none' on the other (e.g. aggressive styles
  // commit offense and carry no defensive tactic), and that choice must survive.

  // Strategic levers the AI previously left at defaults — hit-location target,
  // protected zone, aggression bias, opening move, and range preference — so NPCs
  // contest the same systems a human player can exploit.
  plan.target = getAITarget(w.style, personality, plan.killDesire ?? 5, intent);
  plan.protect = getAIProtect(w.style, personality, intent);
  plan.aggressionBias = getAIAggressionBias(personality, intent);
  plan.openingMove = getAIOpeningMove(personality);
  const rangePref = getAIRangePreference(w.style);
  if (rangePref) plan.rangePreference = rangePref;

  // Phase-stratified effort curves — opening is conservative, late is personality-modified
  plan.phases = buildPhasePlan(plan, personality, w.style);

  // Desperate plan — wired into resolution.ts at HP<30% or END<20%
  plan.desperatePlan = buildDesperatePlan(plan, personality);

  // Universal ENDURANCE_BELOW condition prepended before personality ones
  // (first-match-wins: this fires before personality-specific conditions)
  const universalConditions = buildUniversalConditions(plan);

  plan.ownerPersonality = personality;
  const adaptations = getPersonalityAdaptations(personality, plan, intent);
  plan.conditions = [...universalConditions, ...(plan.conditions ?? []), ...adaptations];

  // Reconcile two-handed weapon + shield conflict
  if (w.equipment) {
    reconcileGearTwoHanded(plan, w.equipment);
  }

  return plan;
}

// Re-export for backward compatibility
export { getStyleMatchupMods } from '@/engine/ai/matchup/styleMatcher';
