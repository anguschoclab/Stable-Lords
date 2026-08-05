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
import type { FighterState, ResolutionContext } from './types';

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

export function prepareExchange(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  events: CombatEvent[]
): ExchangeSetup {
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase as StylePhase;
  const phaseKey = phase === 'OPENING' ? 'opening' : phase === 'MID' ? 'mid' : 'late';

  // ── Recovery from knockdown ──
  if (fA.knockedDown) {
    fA.knockedDown = false;
    events.push({ type: 'RECOVERY', actor: 'A' });
  }
  if (fD.knockedDown) {
    fD.knockedDown = false;
    events.push({ type: 'RECOVERY', actor: 'D' });
  }

  // ── Evaluate conditional fight plans (WT-gated) ──
  const wtA = fA.attributes.WT;
  const wtD = fD.attributes.WT;
  const condResultA = evaluateConditions(fA, fD, ctx, wtA);
  const condResultD = evaluateConditions(fD, fA, ctx, wtD);
  fA.activePlan = condResultA.newPlan;
  fD.activePlan = condResultD.newPlan;

  // ── Psych state evaluation ──
  events.push(...evaluatePsychState(fA, fD, ctx, condResultA, condResultD));

  // ── Per-exchange specialty mods ──
  applySpecialtyMods(ctx, fA, fD);

  // ── Psych state modifier lookup ──
  const { psychA, psychD } = getPsychStateMods(fA, fD);

  // ── Desperate state handling ──
  events.push(...handleDesperateState(fA, fD));

  // Use activePlan for all tactic/OE/AL lookups
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

  const [OE_A, AL_A] = calculateFinalOEAL(
    fA.activePlan.phases?.[phaseKey]?.OE ?? fA.activePlan.OE,
    fA.activePlan.phases?.[phaseKey]?.AL ?? fA.activePlan.AL,
    fA.activePlan,
    fA.hp,
    fA.maxHp,
    fA.endurance,
    fA.maxEndurance,
    exchange
  );
  const [OE_D, AL_D] = calculateFinalOEAL(
    fD.activePlan.phases?.[phaseKey]?.OE ?? fD.activePlan.OE,
    fD.activePlan.phases?.[phaseKey]?.AL ?? fD.activePlan.AL,
    fD.activePlan,
    fD.hp,
    fD.maxHp,
    fD.endurance,
    fD.maxEndurance,
    exchange
  );

  // Apply psych state mods and RopeADope fatigue penalty reduction
  const fatA =
    fatiguePenalty(fA.endurance, fA.maxEndurance, ctx.trainerModsA.fatiguePenaltyReduction ?? 0) +
    psychA.defMod +
    psychA.parMod;
  const fatD =
    fatiguePenalty(fD.endurance, fD.maxEndurance, ctx.trainerModsD.fatiguePenaltyReduction ?? 0) +
    psychD.defMod +
    psychD.parMod;
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

  // ── Dynamic trait mods (Berserker, Patient, Disciplined, etc.) ──
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
  const dynTraitsA = getDynamicTraitMods(fA, traitCtxA);
  const dynTraitsD = getDynamicTraitMods(fD, traitCtxD);

  return {
    condResultA, condResultD, tactA, tactD,
    offModsA, defModsA, offModsD, defModsD,
    biasAttA, biasDefA, biasAttD, biasDefD,
    OE_A, AL_A, OE_D, AL_D,
    fatA, fatD, passA, passD,
    dynTraitsA, dynTraitsD, psychA, psychD,
  };
}
