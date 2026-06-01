import {
  performAttackCheck,
  performRiposteCheck,
  performDefenseCheck,
  executeRiposte,
  executeHit,
  applyEnduranceCosts,
} from './exchangeHelpers';
import type { CombatEvent } from '@/types/combat.types';
import { evaluateConditions } from '../mechanics/conditionEngine';
import { contestCheck } from '../mechanics/combatMath';
import { enduranceCost, fatiguePenalty } from '../mechanics/combatFatigue';
import {
  getTempoBonus,
  getStylePassive,
  getStyleAntiSynergy,
  type Phase as StylePhase,
} from '../../stylePassives';
import { getFavoriteRhythmBonus } from '../../favorites';
import { getDynamicTraitMods, type DynamicTraitContext } from '../../traits';
import {
  TACTIC_OVERUSE_CAP,
} from '@/constants/combat';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
  alIniMod,
} from '../mechanics/tacticResolution';
import {
  makeExchangeState,
  runApproach,
  runFeint,
  runCommit,
  runRecovery,
} from './exchangeSubPhases';
import { getZonePenalty, getWeaponRangeMod } from '../mechanics/distanceResolution';
import { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
import { applySpecialtyMods } from './specialtyMods';
import { resolveEffectiveTactics, applyAggressionBias } from './tactics';
import type { FighterState, ResolutionContext } from './types';
import type { Warrior } from '@/types/warrior.types';

// Re-export from split modules
export type { FighterState, ResolutionContext } from './types';
export { resolveEffectiveTactics, applyAggressionBias } from './tactics';
export { DECISION_HIT_MARGIN, getMatchupBonus } from '@/constants/combat';
export { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
export { applySpecialtyMods } from './specialtyMods';/**
                                                      * Resolve exchange.
                                                      * @param ctx - Ctx.
                                                      * @param fA - F a.
                                                      * @param fD - F d.
                                                      * @returns The result.
                                                      */


// ─── Phase Handlers ─────────────────────────────────────────────────────────

// ─── Phase Handlers ─────────────────────────────────────────────────────────

/**
 * Resolve the initiative phase to determine which fighter goes first.
 */
function resolveInitiativePhase(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  OE_A: number,
  AL_A: number,
  OE_D: number,
  AL_D: number,
  fatA: number,
  fatD: number,
  defModsA: any,
  defModsD: any,
  passA: any,
  passD: any,
  psychA: any,
  psychD: any,
  dynTraitsA: any,
  dynTraitsD: any
): {
  aGoesFirst: boolean;
  iniA: number;
  iniD: number;
  event: CombatEvent;
} {
  const { rng, phase } = ctx;
  const stylePhase = phase as StylePhase;

  const masteryIniA = fA.favorites
    ? getFavoriteRhythmBonus(fA as unknown as Warrior, OE_A, AL_A)
    : 0;
  const masteryIniD = fD.favorites
    ? getFavoriteRhythmBonus(fD as unknown as Warrior, OE_D, AL_D)
    : 0;

  const iniA =
    fA.skills.INI +
    alIniMod(AL_A) +
    ctx.matchupA +
    fatA +
    defModsA.iniBonus +
    getTempoBonus(fA.style, stylePhase) +
    passA.iniBonus +
    masteryIniA -
    fA.legHits +
    psychA.iniMod +
    fA.momentum * 2 +
    (ctx.trainerModsA.iniMod ?? 0) +
    ctx.weatherEffect.initiativeMod +
    ctx.surfaceMod.initiativeMod +
    dynTraitsA.iniMod;

  const iniD =
    fD.skills.INI +
    alIniMod(AL_D) +
    ctx.matchupD +
    fatD +
    defModsD.iniBonus +
    getTempoBonus(fD.style, stylePhase) +
    passD.iniBonus +
    masteryIniD -
    fD.legHits +
    psychD.iniMod +
    fD.momentum * 2 +
    (ctx.trainerModsD.iniMod ?? 0) +
    ctx.weatherEffect.initiativeMod +
    ctx.surfaceMod.initiativeMod +
    dynTraitsD.iniMod;

  const aGoesFirst = contestCheck(rng, iniA, iniD);
  const attLabel = aGoesFirst ? 'A' : 'D';
  const attMasteryIni = aGoesFirst ? masteryIniA : masteryIniD;

  const event: CombatEvent = {
    type: 'INITIATIVE',
    actor: attLabel,
    value: aGoesFirst ? iniA : iniD,
    result: true,
    metadata: { isMastery: attMasteryIni > 0 },
  };

  return { aGoesFirst, iniA, iniD, event };
}

/**
 * Resolve the attack and defense checks, including ripostes and successful hits.
 */
function resolveCombatOffenseDefense(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState,
  aGoesFirst: boolean,
  OE_A: number,
  AL_A: number,
  OE_D: number,
  AL_D: number,
  fatA: number,
  fatD: number,
  offModsA: any,
  offModsD: any,
  defModsA: any,
  defModsD: any,
  passA: any,
  passD: any,
  biasAttA: number,
  biasDefA: number,
  biasAttD: number,
  biasDefD: number,
  tactA: any,
  tactD: any,
  psychA: any,
  psychD: any,
  dynTraitsA: any,
  dynTraitsD: any,
  feintAttBonus: number,
  feintDefBonus: number,
  attCommit: any,
  defCommit: any,
  es: any,
  phaseKey: 'opening' | 'mid' | 'late',
  stylePhase: StylePhase,
  events: CombatEvent[]
): void {
  const { rng, phase } = ctx;
  const att = aGoesFirst ? fA : fD;
  const def = aGoesFirst ? fD : fA;
  const attLabel = aGoesFirst ? 'A' : 'D';
  const defLabel = aGoesFirst ? 'D' : 'A';

  const curAttOE = aGoesFirst ? OE_A : OE_D;
  const curAttAL = aGoesFirst ? AL_A : AL_D;
  const curOffMods = aGoesFirst ? offModsA : offModsD;
  const curPassA = aGoesFirst ? passA : passD;
  const curBiasAtt = aGoesFirst ? biasAttA : biasAttD;
  const curAntiSyn = getStyleAntiSynergy(
    att.style,
    (aGoesFirst ? tactA : tactD).offTactic,
    (aGoesFirst ? tactA : tactD).defTactic
  );
  const overAtt = aGoesFirst
    ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA)
    : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD);
  const curAttWepReq = aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD;

  const attMomentumBonus = att.momentum * 2;
  const attPsychMod = aGoesFirst ? psychA.attMod : psychD.attMod;
  const attWeaponRangeMod = getWeaponRangeMod(att.weaponId, ctx.range);
  const defWeaponRangeMod = getWeaponRangeMod(def.weaponId, ctx.range);
  const attDynTraitAtt = aGoesFirst ? dynTraitsA.attMod : dynTraitsD.attMod;
  const defDynTraitPar = aGoesFirst ? dynTraitsD.parMod : dynTraitsA.parMod;
  const defDynTraitDef = aGoesFirst ? dynTraitsD.defMod : dynTraitsA.defMod;

  const attSucc = performAttackCheck(
    rng,
    att,
    curAttOE,
    aGoesFirst ? ctx.matchupA : ctx.matchupD,
    aGoesFirst ? fatA : fatD,
    curOffMods,
    curPassA,
    curAntiSyn,
    curBiasAtt,
    overAtt,
    curAttWepReq,
    attMomentumBonus +
      attPsychMod +
      (aGoesFirst ? es.rangeModA : es.rangeModD) +
      attCommit.attBonus +
      feintAttBonus +
      attWeaponRangeMod +
      attDynTraitAtt
  );

  if (!attSucc) {
    events.push({ type: 'ATTACK', actor: attLabel, result: 'WHIFF' });
    att.consecutiveHits = 0;
    att.endurance -=
      Math.max(1, Math.floor(enduranceCost(curAttOE, curAttAL, ctx.weather) * 0.5)) +
      curOffMods.endCost;

    const curAntiSynDef = getStyleAntiSynergy(
      def.style,
      (aGoesFirst ? tactD : tactA).offTactic,
      (aGoesFirst ? tactD : tactA).defTactic
    );
    const ripCheck = performRiposteCheck(
      rng,
      def,
      aGoesFirst ? ctx.matchupD : ctx.matchupA,
      aGoesFirst ? fatD : fatA,
      curOffMods.defPenalty - 4,
      aGoesFirst ? passD : passA,
      curAntiSynDef
    );
    if (ripCheck) {
      executeRiposte(
        events,
        rng,
        att,
        def,
        aGoesFirst ? tactD : tactA,
        aGoesFirst ? passD : passA,
        attLabel,
        defLabel
      );
    }
  } else {
    const curDefOE = aGoesFirst ? OE_D : OE_A;
    const curDefMods = aGoesFirst ? defModsD : defModsA;
    const curPassD = aGoesFirst ? passD : passA;
    const curBiasDef = aGoesFirst ? biasDefD : biasDefA;
    const curDefAL = aGoesFirst ? AL_D : AL_A;
    const defTacticType = (aGoesFirst ? tactD : tactA).defTactic;
    const isDodge =
      curDefAL <= 3
        ? false
        : curDefAL >= 7 && defTacticType === 'none'
          ? true
          : defTacticType === 'Dodge';
    const overDef = aGoesFirst
      ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD)
      : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA);
    const curAntiSynDef = getStyleAntiSynergy(
      def.style,
      (aGoesFirst ? tactD : tactA).offTactic,
      (aGoesFirst ? tactD : tactA).defTactic
    );

    const zonePenalty =
      ctx.pushedFighter === def.label ? Math.abs(getZonePenalty(ctx.zone, ctx.arenaConfig)) : 0;
    const defRangePenalty = Math.max(0, -defWeaponRangeMod);
    const extraDefPenalty =
      zonePenalty -
      defCommit.defPenalty +
      feintDefBonus +
      defRangePenalty -
      defDynTraitPar -
      defDynTraitDef;

    const defCheck = performDefenseCheck(
      rng,
      def,
      curDefOE,
      aGoesFirst ? ctx.matchupD : ctx.matchupA,
      aGoesFirst ? fatD : fatA,
      curDefMods,
      curPassD,
      curBiasDef,
      overDef,
      isDodge,
      curAntiSynDef,
      curOffMods,
      ctx,
      att,
      extraDefPenalty
    );

    if (defCheck.success) {
      events.push({ type: 'DEFENSE', actor: defLabel, result: defCheck.type });
      if (!isDodge) {
        const prevDefMomParry = def.momentum;
        const prevAttMomParry = att.momentum;
        def.momentum = Math.min(3, def.momentum + 1);
        att.momentum = Math.max(-3, att.momentum - 1);
        if (def.momentum !== prevDefMomParry || att.momentum !== prevAttMomParry) {
          events.push({
            type: 'MOMENTUM_SHIFT',
            actor: defLabel,
            value: def.momentum,
            metadata: {
              prev: prevDefMomParry,
              reason: 'PARRY',
              attPrev: prevAttMomParry,
              attNew: att.momentum,
            },
          });
        }
        const ripPostParry = performRiposteCheck(
          rng,
          def,
          aGoesFirst ? ctx.matchupD : ctx.matchupA,
          aGoesFirst ? fatD : fatA,
          (aGoesFirst ? defModsD : defModsA).ripBonus + ctx.weatherEffect.riposteMod,
          curPassD,
          undefined
        );
        const specRiposteMult = aGoesFirst
          ? (ctx.trainerModsD.riposteDamageMult ?? 1.0)
          : (ctx.trainerModsA.riposteDamageMult ?? 1.0);
        if (ripPostParry) {
          executeRiposte(
            events,
            rng,
            att,
            def,
            aGoesFirst ? tactD : tactA,
            aGoesFirst ? passD : passA,
            attLabel,
            defLabel,
            specRiposteMult
          );
        }
      }
      att.consecutiveHits = 0;
    } else {
      const killDesire = aGoesFirst
        ? (fA.activePlan.phases?.[phaseKey]?.killDesire ?? fA.activePlan.killDesire ?? 5)
        : (fD.activePlan.phases?.[phaseKey]?.killDesire ?? fD.activePlan.killDesire ?? 5);
      executeHit(
        events,
        rng,
        att,
        def,
        aGoesFirst ? tactA : tactD,
        curOffMods,
        curPassA,
        attLabel,
        defLabel,
        stylePhase,
        phase,
        killDesire,
        curAttOE,
        curAttAL,
        aGoesFirst ? ctx.matchupA : ctx.matchupD,
        ctx,
        curPassD
      );
    }
  }
}

/**
 * Resolve exchange.
 * @param ctx - Ctx.
 * @param fA - F a.
 * @param fD - F d.
 * @returns The result.
 */
export function resolveExchange(
  ctx: ResolutionContext,
  fA: FighterState,
  fD: FighterState
): CombatEvent[] {
  const events: CombatEvent[] = [];
  const { rng, phase, exchange } = ctx;
  const stylePhase = phase as StylePhase;
  const phaseKey = phase === 'OPENING' ? 'opening' : phase === 'MID' ? 'mid' : 'late';

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

  if (passA.narrative && rng() < 0.4) {
    events.push({ type: 'PASSIVE', actor: 'A', result: passA.narrative });
  }
  if (passD.narrative && rng() < 0.4) {
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
  const dynTraitsA = getDynamicTraitMods(
    fA.traits ? ({ traits: fA.traits } as unknown as Warrior) : undefined,
    traitCtxA
  );
  const dynTraitsD = getDynamicTraitMods(
    fD.traits ? ({ traits: fD.traits } as unknown as Warrior) : undefined,
    traitCtxD
  );

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
  const feintDefBonus = feintResult.feintFailed ? 2 : 0;

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

  return events;
}
