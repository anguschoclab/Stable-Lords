/**
 * Plan axis modifiers — intent shaping, grudge escalation, scouted-plan
 * counter-deltas, and rematch adaptation.
 */
import type { AIIntent, OpponentDossier, OwnerPersonality } from '@/types/state.types';
import type { FightPlan } from '@/types/combat.types';
import { PERSONALITY_PLAN_MODS, PHILOSOPHY_PLAN_MODS } from '@/data/ownerData';
import { clamp } from '@/utils/math';

/**
 * Feint tendency dial by personality — flamboyant and cerebral managers
 * teach feints; methodical and pragmatic managers discourage them. Styles
 * whose base plan carries no feint stay at 0 since `runFeint` can never fire
 * for them.
 */
const PERSONALITY_FEINT_MOD: Partial<Record<OwnerPersonality, number>> = {
  Showman: 2,
  Tactician: 2,
  Pragmatic: -1,
  Methodical: -2,
};

/** Scouted plan tendencies older than this many weeks are ignored. */
const PLAN_INTEL_FRESH_WEEKS = 6;

/** Axis deltas and adaptation flags computed before plan assembly. */
export interface PlanModifiers {
  intentOE: number;
  intentAL: number;
  intentKD: number;
  grudgeKD: number;
  grudgeAL: number;
  intelOE: number;
  intelAL: number;
  intelKD: number;
  intelHotOpener: boolean;
  intelFragile: boolean;
  rematchOE: number;
  rematchAL: number;
  rematchKD: number;
  changeTactics: boolean;
}

/**
 * Computes the contextual axis modifiers: intent shaping, grudge escalation,
 * scouted-plan counter-deltas, and rematch adaptation.
 */
export function computePlanModifiers(
  intent: AIIntent | undefined,
  grudgeIntensity: number,
  dossier: OpponentDossier | undefined,
  now: number | undefined
): PlanModifiers {
  // Intent-based modifiers
  let intentOE = 0;
  let intentAL = 0;
  let intentKD = 0;

  if (intent === 'RECOVERY' || intent === 'SURVIVAL') {
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

  const intel = intelModifiers(dossier, now);
  const rematch = rematchModifiers(dossier);

  return {
    intentOE,
    intentAL,
    intentKD,
    grudgeKD,
    grudgeAL,
    intelOE: intel.intelOE,
    intelAL: intel.intelAL,
    intelKD: intel.intelKD,
    intelHotOpener: intel.intelHotOpener,
    intelFragile: intel.intelFragile,
    rematchOE: rematch.rematchOE,
    rematchAL: rematch.rematchAL,
    rematchKD: rematch.rematchKD,
    changeTactics: rematch.changeTactics,
  };
}

/**
 * Counter-planning off scouted plan tendencies: a fresh dossier estimate of
 * the opponent's OE/AL shifts our axes — cover up against hot openers, press
 * passive shells, raise the kill tempo against brittle defenses.
 */
function intelModifiers(dossier: OpponentDossier | undefined, now: number | undefined) {
  let intelOE = 0;
  let intelAL = 0;
  let intelKD = 0;
  let intelHotOpener = false;
  let intelFragile = false;
  const planIntel = dossier?.planIntel;
  if (
    planIntel &&
    now !== undefined &&
    planIntel.lastPlanWeek !== undefined &&
    now - planIntel.lastPlanWeek <= PLAN_INTEL_FRESH_WEEKS
  ) {
    if ((planIntel.suspectedOE ?? 0.5) >= 0.65) {
      intelAL += 1;
      intelHotOpener = true;
    } else if ((planIntel.suspectedOE ?? 0.5) <= 0.35) {
      intelOE += 1;
    }
    if ((planIntel.suspectedAL ?? 0.5) >= 0.65) {
      intelOE += 1; // break the shell
    } else if ((planIntel.suspectedAL ?? 0.5) <= 0.35) {
      intelKD += 1;
      intelFragile = true;
    }
  }
  return { intelOE, intelAL, intelKD, intelHotOpener, intelFragile };
}

/**
 * Rematch adaptation: a losing record against this specific opponent
 * makes the stable fight more patiently — patience scales with how lopsided
 * the record is; a kill suffered adds personal edge to killDesire.
 */
function rematchModifiers(dossier: OpponentDossier | undefined) {
  let rematchOE = 0;
  let rematchAL = 0;
  let rematchKD = 0;
  let changeTactics = false;
  if (dossier) {
    const { w: wins, l: losses, k: kills } = dossier.recordVs;
    const meetings = wins + losses;
    if (meetings >= 2 && losses > wins) {
      rematchOE = -Math.min(2, losses - wins);
      rematchAL = Math.min(2, losses - wins);
      if (kills > 0) rematchKD = 1;
      // The signature gameplan is losing — the stable abandons its canonical
      // favorite tactics for the suitability-ranked optimal picks.
      changeTactics = true;
    }
  }
  return { rematchOE, rematchAL, rematchKD, changeTactics };
}

/**
 * Merges every dial source — personality, philosophy, style-matchup heuristics,
 * and the computed contextual modifiers — into the clamped FightPlan.
 * Extracted from index.ts per the function-budget guard.
 */
export function mergePlanModifiers(args: {
  base: FightPlan;
  personality: OwnerPersonality;
  philosophy: string;
  matchup: { oe: number; al: number; kd: number };
  mods: PlanModifiers;
}): FightPlan {
  const { base, personality, philosophy, matchup, mods } = args;
  const pMod = PERSONALITY_PLAN_MODS[personality] ?? {};
  const phMod = PHILOSOPHY_PLAN_MODS[philosophy] ?? {};
  return {
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
        ? clamp(
            (base.feintTendency ?? 0) + (PERSONALITY_FEINT_MOD[personality] ?? 0),
            0,
            10
          )
        : 0,
  };
}
