/**
 * Combat Resolution - main orchestrator for exchange resolution.
 * Phase resolver functions extracted to phaseResolvers.ts for SRP separation.
 */
import { applyEnduranceCosts } from './exchangeHelpers';
import type { CombatEvent } from '@/types/combat.types';
import { evaluateConditions } from '../mechanics/conditionEngine';
import { fatiguePenalty } from '../mechanics/combatFatigue';
import {
  getStylePassive,
  type Phase as StylePhase,
} from '../../stylePassives';
import { getDynamicTraitMods, type DynamicTraitContext } from '../../traits';
import {
  TP_FATIGUE_SEVERE_RATIO,
  TP_FATIGUE_MODERATE_RATIO,
  TP_FATIGUE_SEVERE_RIP,
  TP_FATIGUE_SEVERE_DMG,
  TP_FATIGUE_MODERATE_RIP,
  TP_FATIGUE_MODERATE_DMG,
  PL_MOMENTUM_RIPOSTE_DMG_COEFF,
  PR_COUNTER_ON_PARRY,
  PR_COMMIT_PUNISH,
  PR_CHAIN_STEP,
  PR_CHAIN_CAP,
  PASSIVE_NARRATIVE_CHANCE,
  FEINT_FAILED_DEF_BONUS,
} from '@/constants/combat';
import type { CommitLevel } from '@/types/shared.types';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
} from '../mechanics/tacticResolution';
import {
  makeExchangeState,
  runApproach,
  runFeint,
  runCommit,
  runRecovery,
} from './exchangeSubPhases';
import { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
import { applySpecialtyMods } from './specialtyMods';
import { resolveEffectiveTactics, applyAggressionBias } from './tactics';
import type { FighterState, ResolutionContext } from './types';
import { FightingStyle } from '@/types/shared.types';
import { tickBleed } from './bleed';
import {
  resolveInitiativePhase,
  resolveCombatOffenseDefense,
} from './phaseResolvers';

// Re-export from split modules
export type { FighterState, ResolutionContext } from './types';
export { resolveEffectiveTactics, applyAggressionBias } from './tactics';
export { DECISION_HIT_MARGIN, getMatchupBonus } from '@/constants/combat';
export { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
export { applySpecialtyMods } from './specialtyMods';
export { resolveInitiativePhase, resolveWhiffRiposte, resolveContestedDefense, resolveCombatOffenseDefense } from './phaseResolvers';
export type { OffenseDefenseCtx } from './phaseResolvers';

export function styleRiposteBonus(
  def: FighterState,
  att: FighterState,
  opts: { afterParry?: boolean; attCommitLevel?: CommitLevel; riposteStreak?: number } = {}
): { ripBonus: number; dmgBonus: number } {
  let ripBonus = 0;
  let dmgBonus = 0;

  // TP: fatigue-exploit counter — opponent's exhaustion feeds riposte chance and damage
  if (def.style === FightingStyle.TotalParry) {
    const endRatio = att.endurance / Math.max(1, att.maxEndurance);
    if (endRatio < TP_FATIGUE_SEVERE_RATIO) {
      ripBonus += TP_FATIGUE_SEVERE_RIP;
      dmgBonus += TP_FATIGUE_SEVERE_DMG;
    } else if (endRatio < TP_FATIGUE_MODERATE_RATIO) {
      ripBonus += TP_FATIGUE_MODERATE_RIP;
      dmgBonus += TP_FATIGUE_MODERATE_DMG;
    }
  }

  // PL: momentum-based riposte pressure (reactive tempo, not raw attack damage).
  // Negated when the target is Wall of Steel — WS is immovable to tempo snowballs.
  if (
    def.style === FightingStyle.ParryLunge &&
    def.momentum > 0 &&
    att.style !== FightingStyle.WallOfSteel
  ) {
    ripBonus += def.momentum;
    dmgBonus += def.momentum * PL_MOMENTUM_RIPOSTE_DMG_COEFF;
  }

  // PR: riposte master — counter-on-parry (frequency), punish-commitment (damage), light chain
  if (def.style === FightingStyle.ParryRiposte) {
    if (opts.afterParry) ripBonus += PR_COUNTER_ON_PARRY;
    dmgBonus += PR_COMMIT_PUNISH[opts.attCommitLevel ?? 'Standard'];
    dmgBonus += Math.min(PR_CHAIN_CAP, (opts.riposteStreak ?? 0) * PR_CHAIN_STEP);
  }

  return { ripBonus, dmgBonus };
}

/** Handles a whiffed attack: endurance cost plus the defender's riposte chance. */

export function resolveExchange(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState
): CombatEvent[] {
  const events: CombatEvent[] = [];
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

  // ── Spatial Sub-Phases ──
  const es = makeExchangeState();

  // Sub-phase 1: Approach — contest distance, update ctx.range
  runApproach(rng, fA, fD, OE_A, OE_D, ctx, es);
  events.push(...es.events.splice(0));

  // 2. Initiative Phase
  const { aGoesFirst, event: iniEvent } = resolveInitiativePhase(
    ctx,
    fA,
    fD,
    OE_A,
    AL_A,
    OE_D,
    AL_D,
    fatA,
    fatD,
    defModsA,
    defModsD,
    passA,
    passD,
    psychA,
    psychD,
    dynTraitsA,
    dynTraitsD
  );
  events.push(iniEvent);

  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;

  // Sub-phase 2: Feint (attacker only)
  const feintResult = runFeint(rng, att, def);
  events.push(...feintResult.events);
  const feintAttBonus = feintResult.feintBonus;
  const feintDefBonus = feintResult.feintFailed ? FEINT_FAILED_DEF_BONUS : 0;

  // Sub-phase 3: Commit — determine CommitLevel for attacker and defender
  const attCommit = runCommit(att, aGoesFirst ? OE_A : OE_D);
  const defCommit = runCommit(def, aGoesFirst ? OE_D : OE_A);
  es.recoveryDebtToWriteA = aGoesFirst ? attCommit.debtToWrite : defCommit.debtToWrite;
  es.recoveryDebtToWriteD = aGoesFirst ? defCommit.debtToWrite : attCommit.debtToWrite;

  // Sub-phase 4: Attack & Defense Check
  resolveCombatOffenseDefense(
    ctx,
    fA,
    fD,
    aGoesFirst,
    OE_A,
    AL_A,
    OE_D,
    AL_D,
    fatA,
    fatD,
    offModsA,
    offModsD,
    defModsA,
    defModsD,
    passA,
    passD,
    biasAttA,
    biasDefA,
    biasAttD,
    biasDefD,
    tactA,
    tactD,
    psychA,
    psychD,
    dynTraitsA,
    dynTraitsD,
    feintAttBonus,
    feintDefBonus,
    attCommit,
    defCommit,
    es,
    phaseKey,
    stylePhase,
    events
  );

  const curAttOE = aGoesFirst ? OE_A : OE_D;
  const curAttAL = aGoesFirst ? AL_A : AL_D;
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;
  const curDefWepReq = aGoesFirst ? ctx.weaponReqD : ctx.weaponReqA;

  applyEnduranceCosts(
    events,
    ctx,
    fA,
    fD,
    aGoesFirst,
    curAttOE,
    curAttAL,
    curAttWepReq,
    curDefWepReq,
    OE_D,
    AL_D,
    OE_A,
    AL_A
  );

  // Sub-phase 5: Recovery — write debt, handle zone transitions
  runRecovery(fA, fD, es.recoveryDebtToWriteA, es.recoveryDebtToWriteD, events, ctx);

  // Track tactic streaks for overuse penalty
  const currTacticA = tactA.offTactic;
  const currTacticD = tactD.offTactic;
  ctx.tacticStreakA =
    currTacticA !== 'none' && ctx.lastOffTacticA === currTacticA
      ? ctx.tacticStreakA + 1
      : currTacticA !== 'none'
        ? 1
        : 0;
  ctx.tacticStreakD =
    currTacticD !== 'none' && ctx.lastOffTacticD === currTacticD
      ? ctx.tacticStreakD + 1
      : currTacticD !== 'none'
        ? 1
        : 0;
  ctx.lastOffTacticA = currTacticA;
  ctx.lastOffTacticD = currTacticD;

  // SL bleed: damage-over-time tick on any bleeding fighter, then decay.
  for (const fighter of [fA, fD]) {
    const stacks = fighter.bleedStacks ?? 0;
    if (stacks > 0) {
      const { damage, next } = tickBleed(stacks);
      fighter.hp -= damage;
      fighter.bleedStacks = next;
      events.push({
        type: 'HIT',
        actor: fighter.label === 'A' ? 'D' : 'A',
        target: fighter.label,
        value: damage,
        location: 'Bleed',
        metadata: { cause: 'BLEED', stacks: next },
      });
    }
  }

  return events;
}
