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
import type { PsychStateMod } from '../mechanics/conditionEngine';
import { contestCheck } from '../mechanics/combatMath';
import { enduranceCost, fatiguePenalty } from '../mechanics/combatFatigue';
import {
  getTempoBonus,
  getStylePassive,
  getStyleAntiSynergy,
  type Phase as StylePhase,
} from '../../stylePassives';
import type { StylePassiveResult } from '../../stylePassives';
import { getFavoriteRhythmBonus } from '../../favorites';
import { getDynamicTraitMods, type DynamicTraitContext, type DynamicTraitMods } from '../../traits';
import { TACTIC_OVERUSE_CAP } from '@/constants/combat';
import {
  getOffensiveTacticMods,
  getDefensiveTacticMods,
  calculateFinalOEAL,
  alIniMod,
  type OffensiveMods,
  type DefensiveMods,
} from '../mechanics/tacticResolution';
import {
  makeExchangeState,
  runApproach,
  runFeint,
  runCommit,
  runRecovery,
  type ExchangeState,
  type CommitResult,
} from './exchangeSubPhases';
import { getZonePenalty, getWeaponRangeMod } from '../mechanics/distanceResolution';
import { getWeaponInitiativeMod } from '../mechanics/weaponStats';
import { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
import { applySpecialtyMods } from './specialtyMods';
import { resolveEffectiveTactics, applyAggressionBias, type ResolvedTactics } from './tactics';
import type { FighterState, ResolutionContext } from './types';
import { FightingStyle } from '@/types/shared.types';
import { getStyleWeatherModifier } from '@/constants/arena';
import { getCounterstrikeAttBonus } from './counterstrike';

// Re-export from split modules
export type { FighterState, ResolutionContext } from './types';
export { resolveEffectiveTactics, applyAggressionBias } from './tactics';
export { DECISION_HIT_MARGIN, getMatchupBonus } from '@/constants/combat';
export { evaluatePsychState, getPsychStateMods, handleDesperateState } from './psychState';
export { applySpecialtyMods } from './specialtyMods'; /**
 * Resolve exchange.
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
  defModsA: DefensiveMods,
  defModsD: DefensiveMods,
  passA: StylePassiveResult,
  passD: StylePassiveResult,
  psychA: PsychStateMod,
  psychD: PsychStateMod,
  dynTraitsA: DynamicTraitMods,
  dynTraitsD: DynamicTraitMods
): {
  aGoesFirst: boolean;
  iniA: number;
  iniD: number;
  event: CombatEvent;
} {
  const { rng, phase } = ctx;
  const stylePhase = phase as StylePhase;

  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD, OE_D, AL_D) : 0;

  // Calculate style-weather modifiers
  const styleWeatherModA = getStyleWeatherModifier(fA.style, ctx.weather, ctx.arenaConfig.tags);
  const styleWeatherModD = getStyleWeatherModifier(fD.style, ctx.weather, ctx.arenaConfig.tags);

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
    styleWeatherModA.initiativeMod +
    getWeaponInitiativeMod(fA.weaponId) +
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
    styleWeatherModD.initiativeMod +
    getWeaponInitiativeMod(fD.weaponId) +
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
 * Bundled inputs + resolved per-side ("current attacker/defender") view for a
 * single offense/defense resolution. Built once in {@link resolveCombatOffenseDefense}
 * and threaded to the branch handlers to avoid passing 30+ positional args.
 */
interface OffenseDefenseCtx {
  // Raw inputs
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  aGoesFirst: boolean;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  offModsA: OffensiveMods;
  offModsD: OffensiveMods;
  defModsA: DefensiveMods;
  defModsD: DefensiveMods;
  passA: StylePassiveResult;
  passD: StylePassiveResult;
  biasDefA: number;
  biasDefD: number;
  tactA: ResolvedTactics;
  tactD: ResolvedTactics;
  dynTraitsA: DynamicTraitMods;
  dynTraitsD: DynamicTraitMods;
  feintDefBonus: number;
  defCommit: CommitResult;
  phaseKey: 'opening' | 'mid' | 'late';
  stylePhase: StylePhase;
  events: CombatEvent[];
  // Resolved per-side view
  att: FighterState;
  def: FighterState;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
  curAttOE: number;
  curAttAL: number;
  curOffMods: OffensiveMods;
  curPassA: StylePassiveResult;
  defWeaponRangeMod: number;
  defDynTraitPar: number;
  defDynTraitDef: number;
}

/** Per-style conditional riposte bonuses (TP fatigue-exploit, PL momentum pressure). */
export function styleRiposteBonus(def: FighterState, att: FighterState): { ripBonus: number; dmgBonus: number } {
  let ripBonus = 0;
  let dmgBonus = 0;

  // TP: fatigue-exploit counter — opponent's exhaustion feeds riposte chance and damage
  if (def.style === FightingStyle.TotalParry) {
    const endRatio = att.endurance / Math.max(1, att.maxEndurance);
    if (endRatio < 0.25) { ripBonus += 5; dmgBonus += 2; }
    else if (endRatio < 0.5) { ripBonus += 2; dmgBonus += 1; }
  }

  // PL: momentum-based riposte pressure (reactive tempo, not raw attack damage).
  // Negated when the target is Wall of Steel — WS is immovable to tempo snowballs.
  if (
    def.style === FightingStyle.ParryLunge &&
    def.momentum > 0 &&
    att.style !== FightingStyle.WallOfSteel
  ) {
    ripBonus += def.momentum;
    dmgBonus += def.momentum * 0.5;
  }

  return { ripBonus, dmgBonus };
}

/** Handles a whiffed attack: endurance cost plus the defender's riposte chance. */
function resolveWhiffRiposte(s: OffenseDefenseCtx): void {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng } = ctx;

  events.push({ type: 'ATTACK', actor: attLabel, result: 'WHIFF' });
  att.consecutiveHits = 0;
  att.endurance -=
    Math.max(1, Math.floor(enduranceCost(s.curAttOE, s.curAttAL, ctx.weather) * 0.5)) +
    s.curOffMods.endCost;

  const curAntiSynDef = getStyleAntiSynergy(
    def.style,
    (aGoesFirst ? s.tactD : s.tactA).offTactic,
    (aGoesFirst ? s.tactD : s.tactA).defTactic
  );
  const styleRip = styleRiposteBonus(def, att);
  const ripCheck = performRiposteCheck(
    rng,
    def,
    aGoesFirst ? ctx.matchupD : ctx.matchupA,
    aGoesFirst ? s.fatD : s.fatA,
    s.curOffMods.defPenalty - 4 + styleRip.ripBonus,
    aGoesFirst ? s.passD : s.passA,
    curAntiSynDef
  );
  if (ripCheck) {
    executeRiposte(
      events,
      rng,
      att,
      def,
      aGoesFirst ? s.tactD : s.tactA,
      aGoesFirst ? s.passD : s.passA,
      attLabel,
      defLabel,
      1.0,
      styleRip.dmgBonus
    );
  }
}

/** Handles a landed attack: defender's defense check, then parry/riposte or hit. */
function resolveContestedDefense(s: OffenseDefenseCtx): void {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng, phase } = ctx;

  const curDefOE = aGoesFirst ? s.OE_D : s.OE_A;
  const curDefMods = aGoesFirst ? s.defModsD : s.defModsA;
  const curPassD = aGoesFirst ? s.passD : s.passA;
  const curBiasDef = aGoesFirst ? s.biasDefD : s.biasDefA;
  const curDefAL = aGoesFirst ? s.AL_D : s.AL_A;
  const defTacticType = (aGoesFirst ? s.tactD : s.tactA).defTactic;
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
    (aGoesFirst ? s.tactD : s.tactA).offTactic,
    (aGoesFirst ? s.tactD : s.tactA).defTactic
  );

  const zonePenalty =
    ctx.pushedFighter === def.label ? Math.abs(getZonePenalty(ctx.zone, ctx.arenaConfig)) : 0;
  const defRangePenalty = Math.max(0, -s.defWeaponRangeMod);
  const extraDefPenalty =
    zonePenalty -
    s.defCommit.defPenalty +
    s.feintDefBonus +
    defRangePenalty -
    s.defDynTraitPar -
    s.defDynTraitDef +
    (def.parDegrade ?? 0);

  const defCheck = performDefenseCheck(
    rng,
    def,
    curDefOE,
    aGoesFirst ? ctx.matchupD : ctx.matchupA,
    aGoesFirst ? s.fatD : s.fatA,
    curDefMods,
    curPassD,
    curBiasDef,
    overDef,
    isDodge,
    curAntiSynDef,
    s.curOffMods,
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
      // PS win condition: a successful parry primes a counterstrike on PS's next attack.
      if (def.style === FightingStyle.ParryStrike) {
        def.counterstrikePrimed = true;
      }
      const styleRip = styleRiposteBonus(def, att);
      const ripPostParry = performRiposteCheck(
        rng,
        def,
        aGoesFirst ? ctx.matchupD : ctx.matchupA,
        aGoesFirst ? s.fatD : s.fatA,
        (aGoesFirst ? s.defModsD : s.defModsA).ripBonus + ctx.weatherEffect.riposteMod + styleRip.ripBonus,
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
          aGoesFirst ? s.tactD : s.tactA,
          aGoesFirst ? s.passD : s.passA,
          attLabel,
          defLabel,
          specRiposteMult,
          styleRip.dmgBonus
        );
      }
    }
    att.consecutiveHits = 0;
  } else {
    const killDesire = aGoesFirst
      ? (s.fA.activePlan.phases?.[s.phaseKey]?.killDesire ?? s.fA.activePlan.killDesire ?? 5)
      : (s.fD.activePlan.phases?.[s.phaseKey]?.killDesire ?? s.fD.activePlan.killDesire ?? 5);
    executeHit(
      events,
      rng,
      att,
      def,
      aGoesFirst ? s.tactA : s.tactD,
      s.curOffMods,
      s.curPassA,
      attLabel,
      defLabel,
      s.stylePhase,
      phase,
      killDesire,
      s.curAttOE,
      s.curAttAL,
      aGoesFirst ? ctx.matchupA : ctx.matchupD,
      ctx,
      curPassD
    );
  }
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
  offModsA: OffensiveMods,
  offModsD: OffensiveMods,
  defModsA: DefensiveMods,
  defModsD: DefensiveMods,
  passA: StylePassiveResult,
  passD: StylePassiveResult,
  biasAttA: number,
  biasDefA: number,
  biasAttD: number,
  biasDefD: number,
  tactA: ResolvedTactics,
  tactD: ResolvedTactics,
  psychA: PsychStateMod,
  psychD: PsychStateMod,
  dynTraitsA: DynamicTraitMods,
  dynTraitsD: DynamicTraitMods,
  feintAttBonus: number,
  feintDefBonus: number,
  attCommit: CommitResult,
  defCommit: CommitResult,
  es: ExchangeState,
  phaseKey: 'opening' | 'mid' | 'late',
  stylePhase: StylePhase,
  events: CombatEvent[]
): void {
  const { rng } = ctx;
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

  // PS win condition: spend the primed counterstrike on this attack (hit or miss).
  const counterstrikeAtt = getCounterstrikeAttBonus(att);
  att.counterstrikePrimed = false; // window lapses on the attempt
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
      attDynTraitAtt +
      counterstrikeAtt
  );

  const s: OffenseDefenseCtx = {
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
    biasDefA,
    biasDefD,
    tactA,
    tactD,
    dynTraitsA,
    dynTraitsD,
    feintDefBonus,
    defCommit,
    phaseKey,
    stylePhase,
    events,
    att,
    def,
    attLabel,
    defLabel,
    curAttOE,
    curAttAL,
    curOffMods,
    curPassA,
    defWeaponRangeMod,
    defDynTraitPar,
    defDynTraitDef,
  };

  if (!attSucc) {
    resolveWhiffRiposte(s);
  } else {
    resolveContestedDefense(s);
  }
}

/**
 * Resolve exchange.
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
