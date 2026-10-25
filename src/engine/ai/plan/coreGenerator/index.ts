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
import { clamp } from '@/utils/math';
import { getStyleMatchupMods, getStyleSuitabilityBias } from '@/engine/ai/matchup/styleMatcher';
import { applyStyleDoctrine, applyStrategyLabSteering } from './doctrine';
import { validateAndAdjustPlan } from '@/engine/ai/plan/strategyValidator';
import { reconcileGearTwoHanded } from '@/engine/strategy/planBias';
import { computePlanModifiers, mergePlanModifiers } from './modifiers';
import { applyStrategicLayer } from './strategicLayer';
import type { ChallengePlans } from '@/types/shared/fightPlan';

/**
 * Canon "special strategy" preparation by personality: planners (Tactician/
 * Methodical) keep alternates for both roles, Aggressive stables pack an
 * all-out opener for their own challenges, and VENDETTA stables prep a
 * surprise counter for the grudge match they expect to be challenged into.
 */
function applyChallengePlanEmission(
  plan: FightPlan,
  personality: OwnerPersonality,
  intent?: AIIntent
): void {
  const slots: ChallengePlans = {};
  if (personality === 'Tactician' || personality === 'Methodical') {
    slots.whenProposer = {
      OE: clamp(plan.OE + 1, 1, 10),
      AL: clamp(plan.AL - 1, 1, 10),
    };
    slots.whenChallenged = {
      OE: clamp(plan.OE - 2, 1, 10),
      AL: clamp(plan.AL + 2, 1, 10),
      killDesire: Math.max(1, (plan.killDesire ?? 5) - 2),
    };
  }
  if (personality === 'Aggressive') {
    slots.whenProposer = {
      OE: clamp(plan.OE + 2, 1, 10),
      AL: clamp(plan.AL - 1, 1, 10),
      killDesire: Math.min(10, (plan.killDesire ?? 5) + 2),
    };
  }
  if (intent === 'VENDETTA' && !slots.whenChallenged) {
    // The blood feud they expect: meet the challenger hot.
    slots.whenChallenged = {
      OE: clamp(plan.OE + 1, 1, 10),
      AL: clamp(plan.AL - 1, 1, 10),
    };
  }
  if (slots.whenProposer || slots.whenChallenged) plan.challengePlans = slots;
}

/**
 * Generate a personality-, philosophy-, meta-, and matchup-aware fight plan for an AI warrior.
 * Now includes per-style matchup heuristics, global strategic intent, and strategy score validation.
 */
interface AiPlanForWarriorArgs {
  w: Warrior;
  personality: OwnerPersonality;
  philosophy: string;
  opponentStyle?: FightingStyle;
  intent?: AIIntent;
  grudgeIntensity?: number;
  dossier?: OpponentDossier;
  now?: number;
  /** Owner competence tier — scales adaptive-condition density. */
  competence?: OwnerCompetence;
}

/** Aggregates every dial source into the initial clamped plan. */
function assembleBasePlan(args: AiPlanForWarriorArgs): {
  plan: FightPlan;
  mods: ReturnType<typeof computePlanModifiers>;
} {
  const { w, personality, philosophy, opponentStyle, intent } = args;
  const { grudgeIntensity = 0, dossier, now } = args;
  const base = defaultPlanForWarrior(w);
  const mods = computePlanModifiers(intent, grudgeIntensity, dossier, now);

  // Per-style matchup heuristics
  const matchup = opponentStyle
    ? getStyleMatchupMods(w.style, opponentStyle)
    : { oe: 0, al: 0, kd: 0 };

  const plan = mergePlanModifiers({ base, personality, philosophy, matchup, mods });
  applyStrategyLabSteering(plan, w, now ?? 0);
  return { plan, mods };
}

export { applyStyleDoctrine } from './doctrine';

/** Strategy-score validation and style-suitability bias on the assembled plan. */
function applyPlanValidation(plan: FightPlan, w: Warrior): void {
  // Strategy score validation with retry logic
  validateAndAdjustPlan(plan, w);

  // Tactic suitability validation - adjust OE/AL based on style compatibility
  // High OE is more suitable for aggressive styles, high AL for defensive styles
  const styleSuitabilityBias = getStyleSuitabilityBias(w.style);
  plan.OE = clamp(plan.OE + styleSuitabilityBias.oe, 1, 10);
  plan.AL = clamp(plan.AL + styleSuitabilityBias.al, 1, 10);

  applyStyleDoctrine(plan, w);
}

/** Generates a full weekly plan for one AI warrior given owner personality. */
export function aiPlanForWarrior(args: AiPlanForWarriorArgs): FightPlan {
  const { w, personality, intent } = args;
  const { dossier } = args;
  const { plan, mods } = assembleBasePlan(args);

  applyPlanValidation(plan, w);

  applyStrategicLayer({
    plan: plan,
    w: w,
    personality: personality,
    intent: intent,
    dossier: dossier,
    mods: mods,
    competence: args.competence,
  });

  applyChallengePlanEmission(plan, personality, intent);

  // Reconcile two-handed weapon + shield conflict
  if (w.equipment) {
    reconcileGearTwoHanded(plan, w.equipment);
  }

  return plan;
}
