/**
 * Strategic layer — post-validation plan decoration: tactic overrides for
 * rematch losers, lever application, phase curves, decoy axes, phase shifts,
 * and WIT/competence-gated condition density.
 */
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type { OwnerPersonality, AIIntent, OpponentDossier } from '@/types/state.types';
import type { OwnerCompetence } from '@/types/state/owner';
import { competenceConditionCap } from '@/engine/ai/competence';
import { clamp } from '@/utils/math';
import {
  buildPhasePlan,
  buildDesperatePlan,
  buildUniversalConditions,
} from '@/engine/ai/plan/phasePlanner';
import { getPersonalityAdaptations } from '@/engine/ai/plan/personalityEngine';
import { getBestOffensiveTactic, getBestDefensiveTactic } from '@/engine/ai/plan/tacticAdvisor';
import {
  getAITarget,
  getAIProtect,
  getAIAggressionBias,
  getAIOpeningMove,
  getAIRangePreference,
  getAIFallbackCondition,
  getAITactics,
} from '@/engine/ai/plan/levers';
import { aiFeature } from '@/engine/ai/featureFlags';
import type { DecoyAxes, PhaseShiftDecl } from '@/types/shared/fightPlan';
import type { PlanModifiers } from './modifiers';

/** WT floor for holding a committed deception script through the masked window. */
const DECOY_MIN_WT = 13;

/**
 * Stage D.4 — boundary-reactive phase shifts, authored per personality.
 * Deltas are applied to the plan's real axes at authoring time so the
 * declared shift stays inside validator bounds. `when` reads are evaluated
 * once at the named phase boundary (see resolution/decoyShift).
 */
const PERSONALITY_PHASE_SHIFT: Partial<
  Record<
    OwnerPersonality,
    {
      at: 'mid' | 'late';
      when: PhaseShiftDecl['when'];
      dOE: number;
      dAL: number;
      dKillDesire?: number;
    }
  >
> = {
  // Press the comeback when the script is failing.
  Tactician: { at: 'mid', when: 'MOMENTUM_BEHIND', dOE: 2, dAL: -1 },
  // Sit on the lead — Methodical protects, never chases.
  Methodical: { at: 'late', when: 'MOMENTUM_AHEAD', dOE: -1, dAL: 2 },
  // Never fight scared — behind at the mid boundary, the gears shift up.
  Aggressive: { at: 'mid', when: 'MOMENTUM_BEHIND', dOE: 2, dAL: -1, dKillDesire: 1 },
  // Run up the show when the crowd smells a finish.
  Showman: { at: 'late', when: 'MOMENTUM_AHEAD', dOE: 2, dAL: -1, dKillDesire: 1 },
  // Pragmatic authors no reactive shift — the plan is the plan.
};

interface ApplyStrategicLayerArgs {
  plan: FightPlan;
  w: Warrior;
  personality: OwnerPersonality;
  intent: AIIntent | undefined;
  dossier: OpponentDossier | undefined;
  mods: PlanModifiers;
  competence?: OwnerCompetence;
}

/**
 * Dossier- and read-driven counter-conditions appended onto the base plan:
 * shell up against a known killer (dossier), punish a predictable opponent
 * (Stage D repetition read for sharp-eyed stables on high-WT fighters).
 */
function collectAdaptations(
  plan: FightPlan,
  w: Warrior,
  personality: OwnerPersonality,
  dossier: OpponentDossier | undefined
): FightPlan['conditions'] {
  const adaptations: NonNullable<FightPlan['conditions']> = [];
  // Dossier-driven counter-conditions: a stable that knows the opponent has
  // killed one of its fighters shells up the moment that opponent seizes tempo.
  if (aiFeature('AI_READS') && (dossier?.recordVs.k ?? 0) > 0) {
    adaptations.push({
      trigger: { type: 'OPPONENT_MOMENTUM_LEAD', value: 2 },
      override: { AL: clamp(plan.AL + 2, 1, 10), OE: clamp(plan.OE - 1, 1, 10) },
      label: 'Scouted: shell up vs the killer',
    });
  }

  // Stage D — repetition read: sharp-eyed stables (Tactician/Methodical)
  // teach their high-WT fighters to punish a predictable opponent — the
  // plan switches to a counter-posture once the streak counter climbs.
  if (
    aiFeature('AI_READS') &&
    (personality === 'Tactician' || personality === 'Methodical') &&
    (w.attributes?.WT ?? 10) >= 7
  ) {
    adaptations.push({
      trigger: { type: 'OPPONENT_TACTIC_STREAK', value: 3 },
      override: { AL: clamp(plan.AL + 2, 1, 10), OE: clamp(plan.OE - 1, 1, 10) },
      label: 'Read: punish the pattern',
    });
  }
  return adaptations;
}

/**
 * Stage D.2b — committed in-bout deception: deceptive stables send smart
 * fighters out performing a false tempo until the mid boundary. The mask
 * is a real performance cost — opponent streak/momentum reads build on
 * the decoy — so it stays gated to deceptive stables on high-WT fighters.
 */
function applyDecoyAxes(plan: FightPlan, w: Warrior, personality: OwnerPersonality): void {
  if (
    !aiFeature('AI_DECOY') ||
    (personality !== 'Tactician' && personality !== 'Methodical') ||
    (w.attributes?.WT ?? 10) < DECOY_MIN_WT
  ) {
    return;
  }
  const styleTactic = getAITactics(w.style).offTactic;
  const decoy: DecoyAxes = {
    untilPhase: 'mid',
    OE: clamp(11 - plan.OE, 1, 10),
    AL: clamp(11 - plan.AL, 1, 10),
  };
  // Mirror the scouting-level decoy: a fighter off the style stereotype
  // performs the stereotype to bait counters; a stereotypical plan hides
  // its hand entirely.
  if (plan.offensiveTactic && plan.offensiveTactic !== styleTactic && styleTactic) {
    decoy.offensiveTactic = styleTactic;
  } else if (plan.offensiveTactic === styleTactic) {
    decoy.offensiveTactic = 'none';
  }
  plan.decoyAxes = decoy;
}

/**
 * Stage D.4 — boundary-reactive curve: one committed shift per
 * personality, evaluated once at the phase boundary. Distinct from
 * per-exchange conditions — a swing back does not revoke it.
 */
function applyPhaseShift(plan: FightPlan, personality: OwnerPersonality): void {
  const shift = PERSONALITY_PHASE_SHIFT[personality];
  if (!shift) return;
  plan.phaseShiftOn = [
    {
      at: shift.at,
      when: shift.when,
      OE: clamp(plan.OE + shift.dOE, 1, 10),
      AL: clamp(plan.AL + shift.dAL, 1, 10),
      ...(shift.dKillDesire !== undefined
        ? { killDesire: clamp((plan.killDesire ?? 5) + shift.dKillDesire, 1, 10) }
        : {}),
    },
  ];
}

/**
 * Applies the strategic layer after core axes validate: tactic overrides for
 * rematch losers, target/protect/aggression/opening/range levers, phase
 * curves, desperate plan, fallback condition, and WIT-gated conditions.
 */
export function applyStrategicLayer(args: ApplyStrategicLayerArgs): void {
  const { plan, w, personality, intent, dossier, competence } = args;
  const { mods } = args;
  // Offensive/defensive tactics come from the base plan (defaultPlanForWarrior →
  // getAITactics), which assigns each style its canonical Duel II Favorite Tactics.
  // We intentionally do NOT override them here: some styles canonically run a
  // signature tactic on one side and 'none' on the other (e.g. aggressive styles
  // commit offense and carry no defensive tactic), and that choice must survive.
  // The exception is rematch adaptation: a stable that keeps losing to this
  // opponent scraps the signature gameplan for the advisor's optimal picks.
  if (mods.changeTactics) {
    plan.offensiveTactic = getBestOffensiveTactic(w.style);
    plan.defensiveTactic = getBestDefensiveTactic(w.style);
  }

  // Strategic levers the AI previously left at defaults — hit-location target,
  // protected zone, aggression bias, opening move, and range preference — so NPCs
  // contest the same systems a human player can exploit.
  plan.target = getAITarget(w.style, personality, plan.killDesire ?? 5, intent);
  plan.protect = getAIProtect(w.style, personality, intent);
  // Intel-driven target selection: a scouted hot opener gets the head guard;
  // a scouted fragile defense invites the kill shot.
  if (mods.intelHotOpener) plan.protect = 'Head';
  if (mods.intelFragile) plan.target = 'Head';
  plan.aggressionBias = getAIAggressionBias(personality, intent);
  plan.openingMove = getAIOpeningMove(personality);
  const rangePref = getAIRangePreference(w.style);
  if (rangePref) plan.rangePreference = rangePref;

  // Phase-stratified effort curves — opening is conservative, late is personality-modified
  plan.phases = buildPhasePlan(plan, personality, w.style);

  // Desperate plan — wired into resolution.ts at HP<30% or END<20%
  plan.desperatePlan = buildDesperatePlan(plan, personality);

  // Fallback condition — granular tactical fallback (FLEE/TURTLE/BERZERK/YIELD)
  // coexists with desperatePlan: deltas apply in calculateFinalOEAL on top of active plan
  plan.fallbackCondition = getAIFallbackCondition(personality, w.style, intent);

  // Universal ENDURANCE_BELOW condition prepended before personality ones
  // (first-match-wins: this fires before personality-specific conditions)
  const universalConditions = buildUniversalConditions(plan);

  plan.ownerPersonality = personality;
  const adaptations = [
    ...getPersonalityAdaptations(personality, plan, intent),
    ...(collectAdaptations(plan, w, personality, dossier) ?? []),
  ];
  const allConditions = [...universalConditions, ...(plan.conditions ?? []), ...adaptations];
  // WIT-gated condition density (F.3): low-WIT warriors carry sparse,
  // "mistake-shaped" plans — few adaptive branches — mirroring the
  // evaluationInterval tiers that already gate re-evaluation cadence in
  // conditionEngine (WT>=7 every exchange, 4-6 every 3, <4 every 5).
  // The universal ENDURANCE_BELOW safety is always retained.
  const wt = w.attributes?.WT ?? 10;
  const witCap =
    wt >= 7
      ? allConditions.length
      : wt >= 4
        ? universalConditions.length + 1
        : universalConditions.length;
  // Competence compounds the WIT gate — a Novice front office authors thinner
  // adaptive plans than a Master for the same fighter (Stage B). The
  // universal ENDURANCE_BELOW safety floor is always retained.
  const conditionCap = competenceConditionCap(
    { competence },
    witCap,
    universalConditions.length
  );
  plan.conditions = allConditions.slice(0, conditionCap);
  applyDecoyAxes(plan, w, personality);
  applyPhaseShift(plan, personality);
}
