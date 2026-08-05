/**
 * Phase Resolvers - Individual combat phase resolution logic.
 * Extracted from resolution.ts for SRP separation.
 */
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
import {
  TACTIC_OVERUSE_CAP,
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
  MOMENTUM_CAP,
  MOMENTUM_FLOOR,
  MOMENTUM_INI_MULT,
  WHIFF_ENDURANCE_COST_MULT,
  WHIFF_RIPOSTE_DEF_PENALTY,
  PASSIVE_NARRATIVE_CHANCE,
  FEINT_FAILED_DEF_BONUS,
} from '@/constants/combat';
import type { CommitLevel } from '@/types/shared.types';
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
import { tickBleed } from './bleed';
import { styleRiposteBonus } from './styleRiposteBonus';

export function resolveInitiativePhase(
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
    fA.momentum * MOMENTUM_INI_MULT +
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
    fD.momentum * MOMENTUM_INI_MULT +
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
export interface OffenseDefenseCtx {
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
  attCommit: CommitResult;
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
        curPassD,
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

  const attMomentumBonus = att.momentum * MOMENTUM_INI_MULT;
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
