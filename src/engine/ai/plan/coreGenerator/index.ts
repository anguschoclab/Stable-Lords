/**
 * AI Plan Core Generator
 * Main orchestrator for generating personality-, philosophy-, meta-, and matchup-aware fight plans.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type { OwnerPersonality, AIIntent, OpponentDossier } from '@/types/state.types';
import type { OwnerCompetence } from '@/types/state/owner';
import { defaultPlanForWarrior } from '@/engine/simulate';
import { PERSONALITY_PLAN_MODS, PHILOSOPHY_PLAN_MODS } from '@/data/ownerData';
import { clamp } from '@/utils/math';
import { getStyleMatchupMods, getStyleSuitabilityBias } from '@/engine/ai/matchup/styleMatcher';
import { validateAndAdjustPlan } from '@/engine/ai/plan/strategyValidator';
import { reconcileGearTwoHanded } from '@/engine/strategy/planBias';
import { computePlanModifiers } from './modifiers';
import { applyStrategicLayer } from './strategicLayer';

export { PLAN_INTEL_FRESH_WEEKS } from './modifiers';
export { DECOY_MIN_WT } from './strategicLayer';

/**
 * Feint modulation by personality (Stage D, N3): the WT-derived baseline
 * in `defaultPlanForWarrior` is shaped — deceptive stables sharpen it,
 * measured ones blunt it. Only an existing aptitude is touched: WT < 15
 * fighters stay at 0 since `runFeint` can never fire for them.
 */
const PERSONALITY_FEINT_MOD: Partial<Record<OwnerPersonality, number>> = {
  Showman: 2,
  Tactician: 2,
  Pragmatic: -1,
  Methodical: -2,
};

/**
 * Generate a personality-, philosophy-, meta-, and matchup-aware fight plan for an AI warrior.
 * Now includes per-style matchup heuristics, global strategic intent, and strategy score validation.
 */
export interface AiPlanForWarriorArgs {
  w: Warrior;
  personality: OwnerPersonality;
  philosophy: string;
  opponentStyle?: FightingStyle;
  intent?: AIIntent;
  grudgeIntensity?: number;
  dossier?: OpponentDossier;
  now?: number;
  /** Owner competence tier — scales adaptive-condition density (Stage B). */
  competence?: OwnerCompetence;
}

/** Generates a full weekly plan for one AI warrior given owner personality. */
export function aiPlanForWarrior(args: AiPlanForWarriorArgs): FightPlan {
  const { w, personality, philosophy, opponentStyle, intent } = args;
  const { grudgeIntensity = 0, dossier, now } = args;
  const base = defaultPlanForWarrior(w);
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};
  const mods = computePlanModifiers(intent, grudgeIntensity, dossier, now);

  // Per-style matchup heuristics
  const matchup = opponentStyle
    ? getStyleMatchupMods(w.style, opponentStyle)
    : { oe: 0, al: 0, kd: 0 };

  // Generate initial plan
  const plan: FightPlan = {
    ...base,
    OE: clamp(
      (base.OE ?? 5) +
        (pMod.OE ?? 0) +
        (phMod.OE ?? 0) +
        matchup.oe +
        mods.intentOE +
        mods.rematchOE +
        mods.intelOE,
      1,
      10
    ),
    AL: clamp(
      (base.AL ?? 5) +
        (pMod.AL ?? 0) +
        (phMod.AL ?? 0) +
        matchup.al +
        mods.intentAL +
        mods.grudgeAL +
        mods.rematchAL +
        mods.intelAL,
      1,
      10
    ),
    killDesire: clamp(
      (base.killDesire ?? 5) +
        (pMod.killDesire ?? 0) +
        (phMod.killDesire ?? 0) +
        matchup.kd +
        mods.intentKD +
        mods.grudgeKD +
        mods.rematchKD +
        mods.intelKD,
      1,
      10
    ),
    feintTendency:
      (base.feintTendency ?? 0) > 0
        ? clamp((base.feintTendency ?? 0) + (PERSONALITY_FEINT_MOD[personality] ?? 0), 0, 10)
        : 0,
  };

  // Strategy score validation with retry logic
  validateAndAdjustPlan(plan, w);

  // Tactic suitability validation - adjust OE/AL based on style compatibility
  // High OE is more suitable for aggressive styles, high AL for defensive styles
  const styleSuitabilityBias = getStyleSuitabilityBias(w.style);
  plan.OE = clamp(plan.OE + styleSuitabilityBias.oe, 1, 10);
  plan.AL = clamp(plan.AL + styleSuitabilityBias.al, 1, 10);

  applyStrategicLayer({ plan: plan, w: w, personality: personality, intent: intent, dossier: dossier, mods: mods, competence: args.competence });

  // Reconcile two-handed weapon + shield conflict
  if (w.equipment) {
    reconcileGearTwoHanded(plan, w.equipment);
  }

  return plan;
}

// Re-export for backward compatibility
export { getStyleMatchupMods } from '@/engine/ai/matchup/styleMatcher';
