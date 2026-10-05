/**
 * Offense/defense prelude — attacker/defender derivation, attack-check roll,
 * and assembly of the shared context handed to the branch handlers.
 */
import { performAttackCheck } from '../exchangeHelpers';
import type { PsychStateMod } from '../../mechanics/conditionEngine';
import { getStyleAntiSynergy } from '../../../stylePassives';
import type { StylePassiveResult } from '../../../stylePassives';
import type { DynamicTraitMods } from '../../../traits';
import { TACTIC_OVERUSE_CAP, MOMENTUM_INI_MULT } from '@/constants/combat';
import { type OffensiveMods } from '../../mechanics/tacticResolution';
import type { ResolutionContext } from '../types';
import type { FighterState } from '../types';
import { getWeaponRangeMod } from '../../mechanics/distanceResolution';
import { getCounterstrikeAttBonus } from '../counterstrike';
import type { OffenseDefenseArgs, OffenseDefenseCtx } from './types';

interface ComputeAttackBonusesArgs {
  ctx: ResolutionContext;
  aGoesFirst: boolean;
  att: FighterState;
  def: FighterState;
  psychA: PsychStateMod;
  psychD: PsychStateMod;
  dynTraitsA: DynamicTraitMods;
  dynTraitsD: DynamicTraitMods;
}

function computeAttackBonuses(args: ComputeAttackBonusesArgs): {
  momentumBonus: number;
  psychMod: number;
  weaponRangeMod: number;
  dynTraitAtt: number;
  counterstrikeAtt: number;
  defWeaponRangeMod: number;
  defDynTraitPar: number;
  defDynTraitDef: number;
} {
  const { ctx, aGoesFirst, att, def, psychA } = args;
  const { psychD, dynTraitsA, dynTraitsD } = args;
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
 * Derives the attacker/defender view, rolls the attack check, and bundles the
 * shared context handed to the whiff/contested branch handlers.
 */
/** Attacker-side view of the raw inputs — resolves the A/D swap once. */
interface AttackView {
  att: FighterState;
  def: FighterState;
  attLabel: 'A' | 'D';
  defLabel: 'A' | 'D';
  curAttOE: number;
  curAttAL: number;
  curOffMods: OffensiveMods;
  curPassA: StylePassiveResult;
  curBiasAtt: number;
  curAntiSyn: ReturnType<typeof getStyleAntiSynergy>;
  overAtt: number;
  curAttWepReq: OffenseDefenseArgs['ctx']['weaponReqA'];
}

function deriveAttackView(args: OffenseDefenseArgs): AttackView {
  const {
    ctx,
    fA,
    fD,
    aGoesFirst,
    OE_A,
    AL_A,
    OE_D,
    AL_D,
    offModsA,
    offModsD,
    passA,
    passD,
    biasAttA,
    biasAttD,
    tactA,
    tactD,
  } = args;
  const att = aGoesFirst ? fA : fD;
  const curAttTact = aGoesFirst ? tactA : tactD;
  return {
    att,
    def: aGoesFirst ? fD : fA,
    attLabel: aGoesFirst ? 'A' : 'D',
    defLabel: aGoesFirst ? 'D' : 'A',
    curAttOE: aGoesFirst ? OE_A : OE_D,
    curAttAL: aGoesFirst ? AL_A : AL_D,
    curOffMods: aGoesFirst ? offModsA : offModsD,
    curPassA: aGoesFirst ? passA : passD,
    curBiasAtt: aGoesFirst ? biasAttA : biasAttD,
    curAntiSyn: getStyleAntiSynergy(att.style, curAttTact.offTactic, curAttTact.defTactic),
    overAtt: aGoesFirst
      ? Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakA)
      : Math.min(TACTIC_OVERUSE_CAP, ctx.tacticStreakD),
    curAttWepReq: aGoesFirst ? ctx.weaponReqA : ctx.weaponReqD,
  };
}

/** Assemble the shared context handed to the whiff/contested branch handlers. */
function buildOffenseCtx(
  args: OffenseDefenseArgs,
  v: AttackView,
  bonuses: ReturnType<typeof computeAttackBonuses>
): OffenseDefenseCtx {
  return {
    ctx: args.ctx,
    fA: args.fA,
    fD: args.fD,
    aGoesFirst: args.aGoesFirst,
    OE_A: args.OE_A,
    AL_A: args.AL_A,
    OE_D: args.OE_D,
    AL_D: args.AL_D,
    fatA: args.fatA,
    fatD: args.fatD,
    offModsA: args.offModsA,
    offModsD: args.offModsD,
    defModsA: args.defModsA,
    defModsD: args.defModsD,
    passA: args.passA,
    passD: args.passD,
    biasDefA: args.biasDefA,
    biasDefD: args.biasDefD,
    tactA: args.tactA,
    tactD: args.tactD,
    dynTraitsA: args.dynTraitsA,
    dynTraitsD: args.dynTraitsD,
    feintDefBonus: args.feintDefBonus,
    attCommit: args.attCommit,
    defCommit: args.defCommit,
    phaseKey: args.phaseKey,
    stylePhase: args.stylePhase,
    events: args.events,
    att: v.att,
    def: v.def,
    attLabel: v.attLabel,
    defLabel: v.defLabel,
    curAttOE: v.curAttOE,
    curAttAL: v.curAttAL,
    curOffMods: v.curOffMods,
    curPassA: v.curPassA,
    defWeaponRangeMod: bonuses.defWeaponRangeMod,
    defDynTraitPar: bonuses.defDynTraitPar,
    defDynTraitDef: bonuses.defDynTraitDef,
  };
}

/**
 *
 */
export function prepareOffenseDefense(args: OffenseDefenseArgs): {
  s: OffenseDefenseCtx;
  attSucc: boolean;
} {
  const { rng } = args.ctx;
  const v = deriveAttackView(args);
  const { att, def, curAttOE, curOffMods, curPassA } = v;

  const bonuses = computeAttackBonuses(
    { ctx: args.ctx, aGoesFirst: args.aGoesFirst, att: att, def: def, psychA: args.psychA, psychD: args.psychD, dynTraitsA: args.dynTraitsA, dynTraitsD: args.dynTraitsD }
  );

  const attSucc = performAttackCheck(
    { rng: rng, att: att, curAttOE: curAttOE, matchup: args.aGoesFirst ? args.ctx.matchupA : args.ctx.matchupD, fat: args.aGoesFirst ? args.fatA : args.fatD, curOffMods: curOffMods, curPass: curPassA, curAntiSyn: v.curAntiSyn, curBiasAtt: v.curBiasAtt, overAtt: v.overAtt, _curAttWepReq: v.curAttWepReq, extraBonus: bonuses.momentumBonus +
      bonuses.psychMod +
      (args.aGoesFirst ? args.es.rangeModA : args.es.rangeModD) +
      args.attCommit.attBonus +
      args.feintAttBonus +
      bonuses.weaponRangeMod +
      bonuses.dynTraitAtt +
      bonuses.counterstrikeAtt }
  );

  return { s: buildOffenseCtx(args, v, bonuses), attSucc };
}
