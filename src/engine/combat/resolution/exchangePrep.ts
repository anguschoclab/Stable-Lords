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
import { applyPairAdjustments } from './exchangeHelpers/tacticAdjust';
import { resolveTacticCounters, type TacticCounterMods } from './tacticCounter';
import { evaluateBoutIntent } from '@/engine/ai/intentStates';
import { applyBoundaryPhaseShifts, resolveDecoyMasks } from './decoyShift';
import { tryRearm } from './disarm';
import { COORD_RISE_FAIL_CHANCE } from '@/constants/combat';
import { getWallHarmonyBonus } from './wallHarmony';
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
  /** Live first-strike edge from each fighter's offensive tactic (tacticCounter). */
  tacticIniA: number;
  tacticIniD: number;
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

interface TacticModBundle {
  tactA: ReturnType<typeof resolveEffectiveTactics>;
  tactD: ReturnType<typeof resolveEffectiveTactics>;
  offModsA: ReturnType<typeof getOffensiveTacticMods>;
  defModsA: ReturnType<typeof getDefensiveTacticMods>;
  offModsD: ReturnType<typeof getOffensiveTacticMods>;
  defModsD: ReturnType<typeof getDefensiveTacticMods>;
  tacticIniA: number;
  tacticIniD: number;
}

interface TacticsAndBias extends TacticModBundle {
  biasAttA: number;
  biasDefA: number;
  biasAttD: number;
  biasDefD: number;
}

/**
 * Resolve both fighters' tactic pairs into modifier bundles plus the
 * pairwise counter-play channel (Response↔Decise RPS): the decise edge
 * becomes a live first-strike bonus carried on tacticIni; the defensive
 * iniBonus is judged against the incoming attack — boosted on a successful
 * counter-read, wasted on a missed one. defMods objects are per-exchange
 * fresh (applyPairAdjustments spreads before any write).
 */
function resolveTacticMods(
  fA: FighterState,
  fD: FighterState,
  phaseKey: 'opening' | 'mid' | 'late'
): TacticModBundle {
  const tactA = resolveEffectiveTactics(fA.activePlan, phaseKey);
  const tactD = resolveEffectiveTactics(fD.activePlan, phaseKey);

  // V24 adjustments (double-tactic shell tax, favorite tactic, KD band) —
  // sibling always returns fresh mod objects.
  const { off: offModsA, def: defModsA } = applyPairAdjustments(
    getOffensiveTacticMods(tactA.offTactic, fA.style),
    getDefensiveTacticMods(tactA.defTactic, fA.style),
    fA,
    tactA.offTactic,
    tactA.defTactic
  );
  const { off: offModsD, def: defModsD } = applyPairAdjustments(
    getOffensiveTacticMods(tactD.offTactic, fD.style),
    getDefensiveTacticMods(tactD.defTactic, fD.style),
    fD,
    tactD.offTactic,
    tactD.defTactic
  );

  const counters: TacticCounterMods = resolveTacticCounters({
    tactA,
    tactD,
    offModsA,
    offModsD,
    defModsA,
    defModsD,
  });
  defModsA.iniBonus = counters.defIniBonusA;
  defModsD.iniBonus = counters.defIniBonusD;

  return {
    tactA,
    tactD,
    offModsA,
    defModsA,
    offModsD,
    defModsD,
    tacticIniA: counters.tacticIniA,
    tacticIniD: counters.tacticIniD,
  };
}

function resolveTacticsAndBias(
  fA: FighterState,
  fD: FighterState,
  phaseKey: 'opening' | 'mid' | 'late'
): TacticsAndBias {
  const mods = resolveTacticMods(fA, fD, phaseKey);
  const [biasAttA, biasDefA] = applyAggressionBias(
    fA.activePlan.phases?.[phaseKey]?.aggressionBias ?? fA.activePlan.aggressionBias ?? 5
  );
  const [biasAttD, biasDefD] = applyAggressionBias(
    fD.activePlan.phases?.[phaseKey]?.aggressionBias ?? fD.activePlan.aggressionBias ?? 5
  );
  return { ...mods, biasAttA, biasDefA, biasAttD, biasDefD };
}

function resolveOEAL(
  fA: FighterState,
  fD: FighterState,
  phaseKey: 'opening' | 'mid' | 'late',
  exchange: number
): { OE_A: number; AL_A: number; OE_D: number; AL_D: number } {
  const [OE_A, AL_A] = calculateFinalOEAL({
    effOE: fA.activePlan.phases?.[phaseKey]?.OE ?? fA.activePlan.OE,
    effAL: fA.activePlan.phases?.[phaseKey]?.AL ?? fA.activePlan.AL,
    plan: fA.activePlan,
    hp: fA.hp,
    maxHp: fA.maxHp,
    end: fA.endurance,
    maxEnd: fA.maxEndurance,
    exchange: exchange,
  });
  const [OE_D, AL_D] = calculateFinalOEAL({
    effOE: fD.activePlan.phases?.[phaseKey]?.OE ?? fD.activePlan.OE,
    effAL: fD.activePlan.phases?.[phaseKey]?.AL ?? fD.activePlan.AL,
    plan: fD.activePlan,
    hp: fD.hp,
    maxHp: fD.maxHp,
    end: fD.endurance,
    maxEnd: fD.maxEndurance,
    exchange: exchange,
  });
  return { OE_A, AL_A, OE_D, AL_D };
}

interface ResolveStylePassivesArgs {
  rng: () => number;
  fA: FighterState;
  fD: FighterState;
  stylePhase: StylePhase;
  phaseKey: 'opening' | 'mid' | 'late';
  exchange: number;
  tactA: ReturnType<typeof resolveEffectiveTactics>;
  tactD: ReturnType<typeof resolveEffectiveTactics>;
  events: CombatEvent[];
}

function resolveStylePassives(args: ResolveStylePassivesArgs): {
  passA: ReturnType<typeof getStylePassive>;
  passD: ReturnType<typeof getStylePassive>;
} {
  const { rng, fA, fD, stylePhase, phaseKey, exchange } = args;
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

  // Wall-of-Steel harmony (She-Puppy rumor): OE == KD hums the guard. Reads
  // the phase-resolved ACTIVE plan — after condition/decoy/desperate swaps —
  // so a desperate 2-6-2 sheet can harmonize itself.
  passA.parBonus += getWallHarmonyBonus(
    fA.style,
    fA.activePlan.phases?.[phaseKey]?.OE ?? fA.activePlan.OE,
    fA.activePlan.phases?.[phaseKey]?.killDesire ?? fA.activePlan.killDesire ?? 5
  );
  passD.parBonus += getWallHarmonyBonus(
    fD.style,
    fD.activePlan.phases?.[phaseKey]?.OE ?? fD.activePlan.OE,
    fD.activePlan.phases?.[phaseKey]?.killDesire ?? fD.activePlan.killDesire ?? 5
  );

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
 * AI intent telemetry — labels which existing plan/state
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

/**
 * Knockdown recovery, boundary phase shifts, conditional-plan evaluation and
 * decoy masking — everything that mutates `activePlan` before tactics resolve.
 */
function recoverAndAdaptPlans(
  fA: FighterState,
  fD: FighterState,
  ctx: ResolutionContext,
  phaseKey: 'opening' | 'mid' | 'late',
  events: CombatEvent[]
): { condResultA: ReturnType<typeof evaluateConditions>; condResultD: ReturnType<typeof evaluateConditions> } {
  const disarmRng = ctx.disarmRng ?? ctx.rng;

  // ── Recovery from knockdown ──
  // Canon (SJJ): clumsy fighters are slower to rise — the auto-clear is a
  // gated roll on the disarm stream; Normal+ always rises (no draw).
  for (const [f, label] of [[fA, 'A'], [fD, 'D']] as const) {
    if (!f.knockedDown) continue;
    const failChance = COORD_RISE_FAIL_CHANCE[f.coordination ?? ''] ?? 0;
    if (failChance > 0 && disarmRng() >= 1 - failChance) continue; // stays down
    f.knockedDown = false;
    events.push({ type: 'RECOVERY', actor: label });
  }

  // ── Pending quickdraw: a fumbled backup draw completes now (no roll —
  // the stumble was one beat of delay). A fighter finishing the draw does
  // not also scramble for the dropped weapon this exchange.
  const drawCompleted = new Set<FighterState>();
  for (const f of [fA, fD]) {
    if (!f.pendingBackupDraw) continue;
    f.pendingBackupDraw = undefined;
    drawCompleted.add(f);
    if (f.backupWeaponId) {
      f.weaponId = f.backupWeaponId;
      f.backupWeaponId = undefined;
    }
  }

  // ── Rearm: a disarmed fighter scrambles for the dropped weapon. Skipped
  // when a pending draw just completed (the new weapon is already in hand).
  if (!drawCompleted.has(fA))
    tryRearm({ events: events, rng: disarmRng, fighter: fA, label: 'A', ctx: ctx });
  if (!drawCompleted.has(fD))
    tryRearm({ events: events, rng: disarmRng, fighter: fD, label: 'D', ctx: ctx });

  // ── Boundary-reactive phase shifts — evaluated on fighter.plan
  // BEFORE conditions so the shifted curve lands in this exchange's plan too.
  // Only at a real phase boundary (cornerAdvice marks the first exchange).
  if (ctx.cornerAdvice && phaseKey !== 'opening') applyBoundaryPhaseShifts(fA, fD, phaseKey);

  // ── Evaluate conditional fight plans (WT-gated) ──
  const condResultA = evaluateConditions(fA, fD, ctx, fA.attributes.WT);
  const condResultD = evaluateConditions(fD, fA, ctx, fD.attributes.WT);
  fA.activePlan = condResultA.newPlan;
  fD.activePlan = condResultD.newPlan;

  // ── Decoy mask: reveal first (emits once), then mask the
  // resolved plan while the window still holds. The decoy is real fight
  // behavior — resolved tactics and OE/AL read the masked plan.
  resolveDecoyMasks(fA, fD, phaseKey, events);

  return { condResultA, condResultD };
}

/** Psych evaluation, specialty mods, psych modifier lookup and desperate state. */
function resolvePsychAndSpecialty(
  fA: FighterState,
  fD: FighterState,
  ctx: ResolutionContext,
  conds: {
    condResultA: ReturnType<typeof evaluateConditions>;
    condResultD: ReturnType<typeof evaluateConditions>;
  },
  events: CombatEvent[]
): { psychA: ReturnType<typeof getPsychStateMods>['psychA']; psychD: ReturnType<typeof getPsychStateMods>['psychD'] } {
  // ── Psych state evaluation ──
  events.push(...evaluatePsychState(fA, fD, ctx, conds.condResultA, conds.condResultD));

  // ── Per-exchange specialty mods ──
  applySpecialtyMods(ctx, fA, fD);

  // ── Psych state modifier lookup ──
  const { psychA, psychD } = getPsychStateMods(fA, fD);

  // ── Desperate state handling ──
  events.push(...handleDesperateState(fA, fD));

  return { psychA, psychD };
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

  const { condResultA, condResultD } = recoverAndAdaptPlans(fA, fD, ctx, phaseKey, events);
  const { psychA, psychD } = resolvePsychAndSpecialty(fA, fD, ctx, { condResultA, condResultD }, events);

  emitIntentTelemetry({
    fA: fA,
    fD: fD,
    ctx: ctx,
    condResultA: condResultA,
    condResultD: condResultD,
    events: events,
  });

  const tac = resolveTacticsAndBias(fA, fD, phaseKey);
  const oal = resolveOEAL(fA, fD, phaseKey, exchange);
  const { fatA, fatD } = resolveFatigueMods(fA, fD, ctx, psychA, psychD);

  const { passA, passD } = resolveStylePassives({
    rng: rng,
    fA: fA,
    fD: fD,
    stylePhase: stylePhase,
    phaseKey: phaseKey,
    exchange: exchange,
    tactA: tac.tactA,
    tactD: tac.tactD,
    events: events,
  });
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
