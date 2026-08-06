/**
 * Offense/defense resolution — attack check, whiff riposte, contested defense.
 * Extracted from phaseResolvers.ts for SRP separation.
 */
import {
  performAttackCheck,
  performRiposteCheck,
  performDefenseCheck,
  executeRiposte,
  executeHit,
} from './exchangeHelpers';
import type { CombatEvent } from '@/types/combat.types';
import type { PsychStateMod } from '../mechanics/conditionEngine';
import { enduranceCost } from '../mechanics/combatFatigue';
import { getStyleAntiSynergy, type Phase as StylePhase } from '../../stylePassives';
import type { StylePassiveResult } from '../../stylePassives';
import type { DynamicTraitMods } from '../../traits';
import {
  TACTIC_OVERUSE_CAP,
  WHIFF_ENDURANCE_COST_MULT,
  WHIFF_RIPOSTE_DEF_PENALTY,
  MOMENTUM_CAP,
  MOMENTUM_FLOOR,
  MOMENTUM_INI_MULT,
} from '@/constants/combat';
import {
  type OffensiveMods,
  type DefensiveMods,
} from '../mechanics/tacticResolution';
import type { CommitResult, ExchangeState } from './exchangeSubPhases';
import { getZonePenalty, getWeaponRangeMod } from '../mechanics/distanceResolution';
import { getStyleWeatherModifier } from '@/constants/arena';
import { getCounterstrikeAttBonus } from './counterstrike';
import { FightingStyle } from '@/types/shared.types';
import { styleRiposteBonus } from './styleRiposteBonus';
import type { FighterState, ResolutionContext } from './types';
import type { ResolvedTactics } from './tactics';

/**
 * Bundled inputs + resolved per-side ("current attacker/defender") view for a
 * single offense/defense resolution. Built once in {@link resolveCombatOffenseDefense}
 * and threaded to the branch handlers to avoid passing 30+ positional args.
 */
export interface OffenseDefenseCtx {
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
  attCommit: CommitResult;
  phaseKey: 'opening' | 'mid' | 'late';
  stylePhase: StylePhase;
  events: CombatEvent[];
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

/** Per-style conditional riposte bonuses (TP fatigue-exploit, PL momentum pressure, PR riposte master). */
export function resolveWhiffRiposte(s: OffenseDefenseCtx): void {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng } = ctx;

  events.push({ type: 'ATTACK', actor: attLabel, result: 'WHIFF' });
  att.consecutiveHits = 0;
  att.endurance -=
    Math.max(
      1,
      Math.floor(enduranceCost(s.curAttOE, s.curAttAL, ctx.weather) * WHIFF_ENDURANCE_COST_MULT)
    ) + s.curOffMods.endCost;

  const curAntiSynDef = getStyleAntiSynergy(
    def.style,
    (aGoesFirst ? s.tactD : s.tactA).offTactic,
    (aGoesFirst ? s.tactD : s.tactA).defTactic
  );
  const styleRip = styleRiposteBonus(def, att, {
    afterParry: false,
    attCommitLevel: s.attCommit.level,
    riposteStreak: def.riposteStreak ?? 0,
  });
  const styleWeatherRipMod = getStyleWeatherModifier(
    def.style,
    ctx.weather,
    ctx.arenaConfig.tags
  ).riposteMod;
  const ripCheck = performRiposteCheck(
    rng,
    def,
    aGoesFirst ? ctx.matchupD : ctx.matchupA,
    aGoesFirst ? s.fatD : s.fatA,
    s.curOffMods.defPenalty -
      WHIFF_RIPOSTE_DEF_PENALTY +
      styleRip.ripBonus +
      ctx.weatherEffect.riposteMod +
      styleWeatherRipMod,
    aGoesFirst ? s.passD : s.passA,
    curAntiSynDef
  );
  if (def.style === FightingStyle.ParryRiposte) {
    def.riposteStreak = ripCheck ? (def.riposteStreak ?? 0) + 1 : 0;
  }
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

function computeExtraDefPenalty(s: OffenseDefenseCtx): number {
  const { ctx, def } = s;
  const zonePenalty =
    ctx.pushedFighter === def.label ? Math.abs(getZonePenalty(ctx.zone, ctx.arenaConfig)) : 0;
  const defRangePenalty = Math.max(0, -s.defWeaponRangeMod);
  return (
    zonePenalty -
    s.defCommit.defPenalty +
    s.feintDefBonus +
    defRangePenalty -
    s.defDynTraitPar -
    s.defDynTraitDef +
    (def.parDegrade ?? 0)
  );
}

function handleSuccessfulDefense(s: OffenseDefenseCtx): void {
  const { ctx, aGoesFirst, att, def, attLabel, defLabel, events } = s;
  const { rng } = ctx;

  const prevDefMomParry = def.momentum;
  const prevAttMomParry = att.momentum;
  def.momentum = Math.min(MOMENTUM_CAP, def.momentum + 1);
  att.momentum = Math.max(MOMENTUM_FLOOR, att.momentum - 1);
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
  const styleRip = styleRiposteBonus(def, att, {
    afterParry: true,
    attCommitLevel: s.attCommit.level,
    riposteStreak: def.riposteStreak ?? 0,
  });
  const styleWeatherRipMod = getStyleWeatherModifier(
    def.style,
    ctx.weather,
    ctx.arenaConfig.tags
  ).riposteMod;
  const ripPostParry = performRiposteCheck(
    rng,
    def,
    aGoesFirst ? ctx.matchupD : ctx.matchupA,
    aGoesFirst ? s.fatD : s.fatA,
    (aGoesFirst ? s.defModsD : s.defModsA).ripBonus +
      ctx.weatherEffect.riposteMod +
      styleRip.ripBonus +
      styleWeatherRipMod,
    aGoesFirst ? s.passD : s.passA,
    undefined
  );
  const specRiposteMult = aGoesFirst
    ? (ctx.trainerModsD.riposteDamageMult ?? 1.0)
    : (ctx.trainerModsA.riposteDamageMult ?? 1.0);
  if (def.style === FightingStyle.ParryRiposte) {
    def.riposteStreak = ripPostParry ? (def.riposteStreak ?? 0) + 1 : 0;
  }
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

/** Handles a landed attack: defender's defense check, then parry/riposte or hit. */
export function resolveContestedDefense(s: OffenseDefenseCtx): void {
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

  const extraDefPenalty = computeExtraDefPenalty(s);

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
      handleSuccessfulDefense(s);
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

function computeAttackBonuses(
  ctx: ResolutionContext,
  aGoesFirst: boolean,
  att: FighterState,
  def: FighterState,
  psychA: PsychStateMod,
  psychD: PsychStateMod,
  dynTraitsA: DynamicTraitMods,
  dynTraitsD: DynamicTraitMods,
): {
  momentumBonus: number;
  psychMod: number;
  weaponRangeMod: number;
  dynTraitAtt: number;
  counterstrikeAtt: number;
  defWeaponRangeMod: number;
  defDynTraitPar: number;
  defDynTraitDef: number;
} {
  const attMomentumBonus = att.momentum * MOMENTUM_INI_MULT;
  const attPsychMod = aGoesFirst ? psychA.attMod : psychD.attMod;
  const attWeaponRangeMod = getWeaponRangeMod(att.weaponId, ctx.range);
  const defWeaponRangeMod = getWeaponRangeMod(def.weaponId, ctx.range);
  const attDynTraitAtt = aGoesFirst ? dynTraitsA.attMod : dynTraitsD.attMod;

  const counterstrikeAtt = getCounterstrikeAttBonus(att);
  att.counterstrikePrimed = false;
  const defDynTraitPar = aGoesFirst ? dynTraitsD.parMod : dynTraitsA.parMod;
  const defDynTraitDef = aGoesFirst ? dynTraitsD.defMod : dynTraitsA.defMod;

  return {
    momentumBonus: attMomentumBonus,
    psychMod: attPsychMod,
    weaponRangeMod: attWeaponRangeMod,
    dynTraitAtt: attDynTraitAtt,
    counterstrikeAtt,
    defWeaponRangeMod,
    defDynTraitPar,
    defDynTraitDef,
  };
}

/**
 * Resolve the attack and defense checks, including ripostes and successful hits.
 */
export function resolveCombatOffenseDefense(
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

  const bonuses = computeAttackBonuses(
    ctx, aGoesFirst, att, def, psychA, psychD, dynTraitsA, dynTraitsD
  );

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
    bonuses.momentumBonus +
      bonuses.psychMod +
      (aGoesFirst ? es.rangeModA : es.rangeModD) +
      attCommit.attBonus +
      feintAttBonus +
      bonuses.weaponRangeMod +
      bonuses.dynTraitAtt +
      bonuses.counterstrikeAtt
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
    attCommit,
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
    defWeaponRangeMod: bonuses.defWeaponRangeMod,
    defDynTraitPar: bonuses.defDynTraitPar,
    defDynTraitDef: bonuses.defDynTraitDef,
  };

  if (!attSucc) {
    resolveWhiffRiposte(s);
  } else {
    resolveContestedDefense(s);
  }
}
