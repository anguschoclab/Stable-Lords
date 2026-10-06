/**
 * Offense/defense branch handlers — whiff riposte and contested defense.
 */
import {
  performRiposteCheck,
  performDefenseCheck,
  executeRiposte,
  executeHit,
} from '../exchangeHelpers';
import { enduranceCost } from '../../mechanics/combatFatigue';
import { getStyleAntiSynergy } from '../../../stylePassives';
import {
  TACTIC_OVERUSE_CAP,
  WHIFF_ENDURANCE_COST_MULT,
  WHIFF_RIPOSTE_DEF_PENALTY,
  MOMENTUM_CAP,
  MOMENTUM_FLOOR,
} from '@/constants/combat';
import { getZonePenalty } from '../../mechanics/distanceResolution';
import { getStyleWeatherModifier } from '@/constants/arena';
import { FightingStyle } from '@/types/shared.types';
import { styleRiposteBonus } from '../styleRiposteBonus';
import { addCapped } from '@/utils/math';
import type { OffenseDefenseCtx } from './types';

/**
 * Stamp pending arena-event riposte-mod sources onto the riposte DEFENSE
 * event just emitted — the narrator echoes the hazard name.
 */
function stampRiposteSources(s: OffenseDefenseCtx): void {
  const sources = s.ctx.arenaEventModSources?.riposte;
  if (!sources?.length) return;
  for (let i = s.events.length - 1; i >= 0; i--) {
    const e = s.events[i];
    if (e?.type === 'DEFENSE' && e.result === 'RIPOSTE') {
      e.metadata = { ...e.metadata, arenaModSources: [...sources] };
      return;
    }
  }
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
    { rng: rng, def: def, matchup: aGoesFirst ? ctx.matchupD : ctx.matchupA, fat: aGoesFirst ? s.fatD : s.fatA, penaltyOrBonus: s.curOffMods.defPenalty -
      WHIFF_RIPOSTE_DEF_PENALTY +
      styleRip.ripBonus +
      ctx.weatherEffect.riposteMod +
      (ctx.arenaEventMods?.riposteMod ?? 0) +
      styleWeatherRipMod, curPass: aGoesFirst ? s.passD : s.passA, curAntiSynDef: curAntiSynDef }
  );
  if (def.style === FightingStyle.ParryRiposte) {
    def.riposteStreak = ripCheck ? (def.riposteStreak ?? 0) + 1 : 0;
  }
  if (ripCheck) {
    executeRiposte(
      { events: events, rng: rng, attacker: att, defender: def, defTactics: aGoesFirst ? s.tactD : s.tactA, defPassive: aGoesFirst ? s.passD : s.passA, attLabel: attLabel, defLabel: defLabel, specialtyRiposteMult: 1.0, extraDmg: styleRip.dmgBonus }
    );
    stampRiposteSources(s);
  } else {
    stampFailedRiposte(s, defLabel);
  }
}

/**
 * A suppressed counter under a pending arena riposte_mod: emit a lightweight
 * marker carrying the hazard sources so the narrator can attribute the
 * silence ("X's riposte labors against the venue's grip") instead of the
 * mod vanishing invisibly like an ordinary miss.
 */
function stampFailedRiposte(s: OffenseDefenseCtx, defLabel: 'A' | 'D'): void {
  const sources = s.ctx.arenaEventModSources?.riposte;
  if (!sources?.length) return;
  s.events.push({
    type: 'DEFENSE',
    actor: defLabel,
    result: 'RIPOSTE_FAILED',
    metadata: { arenaModSources: [...sources] },
  });
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
  def.momentum = addCapped(def.momentum, 1, MOMENTUM_CAP);
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
    { rng: rng, def: def, matchup: aGoesFirst ? ctx.matchupD : ctx.matchupA, fat: aGoesFirst ? s.fatD : s.fatA, penaltyOrBonus: (aGoesFirst ? s.defModsD : s.defModsA).ripBonus +
      ctx.weatherEffect.riposteMod +
      (ctx.arenaEventMods?.riposteMod ?? 0) +
      styleRip.ripBonus +
      styleWeatherRipMod, curPass: aGoesFirst ? s.passD : s.passA, curAntiSynDef: undefined }
  );
  const specRiposteMult = aGoesFirst
    ? (ctx.trainerModsD.riposteDamageMult ?? 1.0)
    : (ctx.trainerModsA.riposteDamageMult ?? 1.0);
  if (def.style === FightingStyle.ParryRiposte) {
    def.riposteStreak = ripPostParry ? (def.riposteStreak ?? 0) + 1 : 0;
  }
  if (ripPostParry) {
    executeRiposte(
      { events: events, rng: rng, attacker: att, defender: def, defTactics: aGoesFirst ? s.tactD : s.tactA, defPassive: aGoesFirst ? s.passD : s.passA, attLabel: attLabel, defLabel: defLabel, specialtyRiposteMult: specRiposteMult, extraDmg: styleRip.dmgBonus }
    );
    stampRiposteSources(s);
  } else {
    stampFailedRiposte(s, defLabel);
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
    { rng: rng, def: def, curDefOE: curDefOE, matchup: aGoesFirst ? ctx.matchupD : ctx.matchupA, fat: aGoesFirst ? s.fatD : s.fatA, curDefMods: curDefMods, curPassD: curPassD, curBiasDef: curBiasDef, overDef: overDef, isDodge: isDodge, curAntiSynDef: curAntiSynDef, curOffMods: s.curOffMods, ctx: ctx, attacker: att, extraDefPenalty: extraDefPenalty }
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
      { events: events, rng: rng, attacker: att, defender: def, attTactics: aGoesFirst ? s.tactA : s.tactD, attOffMods: s.curOffMods, attPassive: s.curPassA, attLabel: attLabel, defLabel: defLabel, stylePhase: s.stylePhase, phase: phase, attKD: killDesire, attOE: s.curAttOE, attAL: s.curAttAL, attMatchup: aGoesFirst ? ctx.matchupA : ctx.matchupD, ctx: ctx, defPassive: curPassD }
    );
  }
}
