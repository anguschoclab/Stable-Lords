/**
 * Pre-exchange setup: recovery, conditions, psych, tactics, fatigue, passives, traits.
 * Extracted from resolution.ts for SRP separation.
 */
import type { CombatEvent } from '@/types/combat.types';
import { evaluateConditions } from '../mechanics/conditionEngine';
import { fatiguePenalty } from '../mechanics/combatFatigue';
import { getStylePassive, type Phase as StylePhase } from '../../stylePassives';
import { getDynamicTraitMods, type DynamicTraitContext } from '../../traits';
import { PASSIVE_NARRATIVE_CHANCE } from '@/constants/combat';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
} from '../mechanics/tacticResolution';
import { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
import { applySpecialtyMods } from './specialtyMods';
import { resolveEffectiveTactics, applyAggressionBias } from './tactics';
import { evaluateBoutIntent } from '@/engine/ai/intentStates';
import { applyDecoyMask, applyPhaseShiftBoundary, emitDecoyReveal } from './decoyShift';
import type { FighterState, ResolutionContext } from './types';

/**
 *
 */
export interface ExchangeSetup {
  condResultA: ReturnType<typeof evaluateConditions>;
  condResultD: ReturnType<typeof evaluateConditions>;
  tactA: ReturnType<typeof resolveEffectiveTactics>;
  tactD: ReturnType<typeof resolveEffectiveTactics>;
  offModsA: ReturnType<typeof getOffensiveTacticMods>;
  defModsA: ReturnType<typeof getDefensiveTacticMods>;
  offModsD: ReturnType<typeof getOffensiveTacticMods>;
  defModsD: ReturnType<typeof getDefensiveTacticMods>;
  biasAttA: number;
  biasDefA: number;
  biasAttD: number;
  biasDefD: number;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  passA: ReturnType<typeof getStylePassive>;
  passD: ReturnType<typeof getStylePassive>;
  dynTraitsA: ReturnType<typeof getDynamicTraitMods>;
  dynTraitsD: ReturnType<typeof getDynamicTraitMods>;
  psychA: ReturnType<typeof getPsychStateMods>['psychA'];
  psychD: ReturnType<typeof getPsychStateMods>['psychD'];
}

function resolveTacticsAndBias(
  fA: FighterState,
  fD: FighterState,
  phaseKey: 'opening' | 'mid' | 'late'
): {
  tactA: ReturnType<typeof resolveEffectiveTactics>;
  tactD: ReturnType<typeof resolveEffectiveTactics>;
  offModsA: ReturnType<typeof getOffensiveTacticMods>;
  defModsA: ReturnType<typeof getDefensiveTacticMods>;
  offModsD: ReturnType<typeof getOffensiveTacticMods>;
  defModsD: ReturnType<typeof getDefensiveTacticMods>;
  biasAttA: number;
  biasDefA: number;
  biasAttD: number;
  biasDefD: number;
} {
  const tactA = resolveEffectiveTactics(fA.activePlan, phaseKey);
  const tactD = resolveEffectiveTactics(fD.activePlan, phaseKey);
  const offModsA = getOffensiveTacticMods(tactA.offTactic, fA.style);
  const defModsA = getDefensiveTacticMods(tactA.defTactic, fA.style);
  const offModsD = getOffensiveTacticMods(tactD.offTactic, fD.style);
  const defModsD = getDefensiveTacticMods(tactD.defTactic, fD.style);

  const [biasAttA, biasDefA] = applyAggressionBias(
    fA.activePlan.phases?.[phaseKey]?.aggressionBias ?? fA.activePlan.aggressionBias ?? 5
  );
  const [biasAttD, biasDefD] = applyAggressionBias(
    fD.activePlan.phases?.[phaseKey]?.aggressionBias ?? fD.activePlan.aggressionBias ?? 5
  );

  return {
    tactA,
    tactD,
    offModsA,
    defModsA,
    offModsD,
    defModsD,
    biasAttA,
    biasDefA,
    biasAttD,
    biasDefD,
  };
}

function resolveOEAL(
  fA: FighterState,
  fD: FighterState,
  phaseKey: 'opening' | 'mid' | 'late',
  exchange: number
): { OE_A: number; AL_A: number; OE_D: number; AL_D: number } {
  const [OE_A, AL_A] = calculateFinalOEAL(
    { effOE: fA.activePlan.phases?.[phaseKey]?.OE ?? fA.activePlan.OE, effAL: fA.activePlan.phases?.[phaseKey]?.AL ?? fA.activePlan.AL, plan: fA.activePlan, hp: fA.hp, maxHp: fA.maxHp, end: fA.endurance, maxEnd: fA.maxEndurance, exchange: exchange }
  );
  const [OE_D, AL_D] = calculateFinalOEAL(
    { effOE: fD.activePlan.phases?.[phaseKey]?.OE ?? fD.activePlan.OE, effAL: fD.activePlan.phases?.[phaseKey]?.AL ?? fD.activePlan.AL, plan: fD.activePlan, hp: fD.hp, maxHp: fD.maxHp, end: fD.endurance, maxEnd: fD.maxEndurance, exchange: exchange }
  );
  return { OE_A, AL_A, OE_D, AL_D };
}

interface ResolveStylePassivesArgs {
  rng: () => number;
  fA: FighterState;
  fD: FighterState;
  stylePhase: StylePhase;
  exchange: number;
  tactA: ReturnType<typeof resolveEffectiveTactics>;
  tactD: ReturnType<typeof resolveEffectiveTactics>;
  events: CombatEvent[];
}

function resolveStylePassives(args: ResolveStylePassivesArgs): { passA: ReturnType<typeof getStylePassive>; passD: ReturnType<typeof getStylePassive> } {
  const { rng, fA, fD, stylePhase, exchange } = args;
  const { tactA, tactD, events } = args;
  const passA = getStylePassive(fA.style, {
    phase: stylePhase,
    exchange,
    hitsLanded: fA.hitsLanded,
    hitsTaken: fA.hitsTaken,
    ripostes: fA.ripostes,
    consecutiveHits: fA.consecutiveHits,
    hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance,
    opponentStyle: fD.style,
    targetedLocation: tactA.target,
    totalFights: fA.totalFights,
  });
  const passD = getStylePassive(fD.style, {
    phase: stylePhase,
    exchange,
    hitsLanded: fD.hitsLanded,
    hitsTaken: fD.hitsTaken,
    ripostes: fD.ripostes,
    consecutiveHits: fD.consecutiveHits,
    hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance,
    opponentStyle: fA.style,
    targetedLocation: tactD.target,
    totalFights: fD.totalFights,
  });

  if (passA.narrative && rng() < PASSIVE_NARRATIVE_CHANCE) {
    events.push({ type: 'PASSIVE', actor: 'A', result: passA.narrative });
  }
  if (passD.narrative && rng() < PASSIVE_NARRATIVE_CHANCE) {
    events.push({ type: 'PASSIVE', actor: 'D', result: passD.narrative });
  }

  return { passA, passD };
}

function resolveDynamicTraits(
  fA: FighterState,
  fD: FighterState,
  stylePhase: StylePhase
): {
  dynTraitsA: ReturnType<typeof getDynamicTraitMods>;
  dynTraitsD: ReturnType<typeof getDynamicTraitMods>;
} {
  const traitCtxA: DynamicTraitContext = {
    phase: stylePhase,
    hpRatio: fA.hp / fA.maxHp,
    endRatio: fA.endurance / fA.maxEndurance,
    consecutiveHits: fA.consecutiveHits,
  };
  const traitCtxD: DynamicTraitContext = {
    phase: stylePhase,
    hpRatio: fD.hp / fD.maxHp,
    endRatio: fD.endurance / fD.maxEndurance,
    consecutiveHits: fD.consecutiveHits,
  };
  return {
    dynTraitsA: getDynamicTraitMods(fA, traitCtxA),
    dynTraitsD: getDynamicTraitMods(fD, traitCtxD),
  };
}

interface EmitIntentTelemetryArgs {
  fA: FighterState;
  fD: FighterState;
  ctx: ResolutionContext;
  condResultA: ReturnType<typeof evaluateConditions>;
  condResultD: ReturnType<typeof evaluateConditions>;
  events: CombatEvent[];
}

/**
 * AI intent telemetry (Stage F) — labels which existing plan/state
 * selection is active (condition override / psych / desperate / kill
 * window). Pure annotation: emits on transitions only, touches no math.
 */
function emitIntentTelemetry(args: EmitIntentTelemetryArgs): void {
  const { fA, fD, ctx, condResultA, condResultD } = args;
  const { events } = args;
  if (!ctx.aiIntentTelemetry) return;
  const intentA = evaluateBoutIntent(fA, fD, ctx);
  if (intentA) events.push(intentA);
  const intentD = evaluateBoutIntent(fD, fA, ctx);
  if (intentD) events.push(intentD);
  // Condition-fire annotations — which trigger actually swapped the plan,
  // marked @CORNER when corner advice forced the off-cadence re-check.
  const cornerTag = ctx.cornerAdvice ? '@CORNER' : '';
  if (condResultA.firedTrigger) {
    events.push({
      type: 'STATE_CHANGE',
      actor: 'A',
      result: `CONDITION_${condResultA.firedTrigger}${cornerTag}`,
    });
  }
  if (condResultD.firedTrigger) {
    events.push({
      type: 'STATE_CHANGE',
      actor: 'D',
      result: `CONDITION_${condResultD.firedTrigger}${cornerTag}`,
    });
  }
}

/** Endurance-derived fatigue penalty plus psych def/par mods, per side. */
function resolveFatigueMods(
  fA: FighterState,
  fD: FighterState,
  ctx: ResolutionContext,
  psychA: ReturnType<typeof getPsychStateMods>['psychA'],
  psychD: ReturnType<typeof getPsychStateMods>['psychD']
): { fatA: number; fatD: number } {
  return {
    fatA:
      fatiguePenalty(fA.endurance, fA.maxEndurance, ctx.trainerModsA.fatiguePenaltyReduction ?? 0) +
      psychA.defMod +
      psychA.parMod,
    fatD:
      fatiguePenalty(fD.endurance, fD.maxEndurance, ctx.trainerModsD.fatiguePenaltyReduction ?? 0) +
      psychD.defMod +
      psychD.parMod,
  };
}

/** Pre-exchange setup: recovery, conditions, psych, tactics, fatigue, passives, traits. */
export function prepareExchange(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  events: CombatEvent[]
): ExchangeSetup {
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase as StylePhase;
  const phaseKey: 'opening' | 'mid' | 'late' =
    phase === 'OPENING' ? 'opening' : phase === 'MID' ? 'mid' : 'late';

  // ── Recovery from knockdown ──
  if (fA.knockedDown) {
    fA.knockedDown = false;
    events.push({ type: 'RECOVERY', actor: 'A' });
  }
  if (fD.knockedDown) {
    fD.knockedDown = false;
    events.push({ type: 'RECOVERY', actor: 'D' });
  }

  // ── Boundary-reactive phase shifts (Stage D.4) — evaluated on fighter.plan
  // BEFORE conditions so the shifted curve lands in this exchange's plan too.
  // Only at a real phase boundary (cornerAdvice marks the first exchange).
  if (ctx.cornerAdvice && phaseKey !== 'opening') {
    applyPhaseShiftBoundary(fA, fD, phaseKey);
    applyPhaseShiftBoundary(fD, fA, phaseKey);
  }

  // ── Evaluate conditional fight plans (WT-gated) ──
  const wtA = fA.attributes.WT;
  const wtD = fD.attributes.WT;
  const condResultA = evaluateConditions(fA, fD, ctx, wtA);
  const condResultD = evaluateConditions(fD, fA, ctx, wtD);
  fA.activePlan = condResultA.newPlan;
  fD.activePlan = condResultD.newPlan;

  // ── Decoy mask (Stage D.2b): reveal first (emits once), then mask the
  // resolved plan while the window still holds. The decoy is real fight
  // behavior — resolved tactics and OE/AL read the masked plan.
  emitDecoyReveal(fA, phaseKey, events);
  emitDecoyReveal(fD, phaseKey, events);
  fA.activePlan = applyDecoyMask(fA.activePlan, phaseKey);
  fD.activePlan = applyDecoyMask(fD.activePlan, phaseKey);

  // ── Psych state evaluation ──
  events.push(...evaluatePsychState(fA, fD, ctx, condResultA, condResultD));

  // ── Per-exchange specialty mods ──
  applySpecialtyMods(ctx, fA, fD);

  // ── Psych state modifier lookup ──
  const { psychA, psychD } = getPsychStateMods(fA, fD);

  // ── Desperate state handling ──
  events.push(...handleDesperateState(fA, fD));

  emitIntentTelemetry({ fA: fA, fD: fD, ctx: ctx, condResultA: condResultA, condResultD: condResultD, events: events });

  const tac = resolveTacticsAndBias(fA, fD, phaseKey);
  const oal = resolveOEAL(fA, fD, phaseKey, exchange);
  const { fatA, fatD } = resolveFatigueMods(fA, fD, ctx, psychA, psychD);

  const { passA, passD } = resolveStylePassives(
    { rng: rng, fA: fA, fD: fD, stylePhase: stylePhase, exchange: exchange, tactA: tac.tactA, tactD: tac.tactD, events: events }
  );
  const { dynTraitsA, dynTraitsD } = resolveDynamicTraits(fA, fD, stylePhase);

  return {
    condResultA,
    condResultD,
    ...tac,
    ...oal,
    fatA,
    fatD,
    passA,
    passD,
    dynTraitsA,
    dynTraitsD,
    psychA,
    psychD,
  };
}
