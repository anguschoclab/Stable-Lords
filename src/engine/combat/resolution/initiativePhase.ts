/**
 * Initiative phase resolution — determines attack order.
 * Extracted from phaseResolvers.ts for SRP separation.
 */
import type { CombatEvent } from '@/types/combat.types';
import type { PsychStateMod } from '../mechanics/conditionEngine';
import { contestCheck } from '../mechanics/combatMath';
import { getTempoBonus, type Phase as StylePhase } from '../../stylePassives';
import type { StylePassiveResult } from '../../stylePassives';
import { getFavoriteRhythmBonus } from '../../favorites';
import type { DynamicTraitMods } from '../../traits';
import { MOMENTUM_INI_MULT } from '@/constants/combat';
import { alIniMod, type DefensiveMods } from '../mechanics/tacticResolution';
import { getWeaponInitiativeMod } from '../mechanics/weaponStats';
import { getStyleWeatherModifier } from '@/constants/arena';
import type { FighterState, ResolutionContext } from './types';

interface SumInitiativeArgs {
  f: FighterState;
  AL: number;
  matchup: number;
  fat: number;
  defMods: DefensiveMods;
  pass: StylePassiveResult;
  psych: PsychStateMod;
  dynTraits: DynamicTraitMods;
  trainerIniMod: number;
  masteryIni: number;
  ctx: ResolutionContext;
  stylePhase: StylePhase;
}

/** Sum one fighter's initiative: skills + tactics + passives + mods. Pure — no RNG. */
function sumInitiative(args: SumInitiativeArgs): number {
  const { f, AL, matchup, fat, defMods } = args;
  const { pass, psych, dynTraits, trainerIniMod, masteryIni } = args;
  const { ctx, stylePhase } = args;
  const styleWeatherMod = getStyleWeatherModifier(f.style, ctx.weather, ctx.arenaConfig.tags);
  return (
    f.skills.INI +
    alIniMod(AL) +
    matchup +
    fat +
    defMods.iniBonus +
    getTempoBonus(f.style, stylePhase) +
    pass.iniBonus +
    masteryIni -
    f.legHits +
    psych.iniMod +
    f.momentum * MOMENTUM_INI_MULT +
    trainerIniMod +
    ctx.weatherEffect.initiativeMod +
    ctx.surfaceMod.initiativeMod +
    (ctx.arenaEventMods?.initiativeMod ?? 0) +
    styleWeatherMod.initiativeMod +
    getWeaponInitiativeMod(f.weaponId) +
    dynTraits.iniMod
  );
}

/**
 *
 */
interface ResolveInitiativePhaseArgs {
  ctx: ResolutionContext;
  fA: FighterState;
  fD: FighterState;
  OE_A: number;
  AL_A: number;
  OE_D: number;
  AL_D: number;
  fatA: number;
  fatD: number;
  defModsA: DefensiveMods;
  defModsD: DefensiveMods;
  passA: StylePassiveResult;
  passD: StylePassiveResult;
  psychA: PsychStateMod;
  psychD: PsychStateMod;
  dynTraitsA: DynamicTraitMods;
  dynTraitsD: DynamicTraitMods;
}

/**
 * Resolve the initiative phase — determines which fighter attacks first.
 */
export function resolveInitiativePhase(args: ResolveInitiativePhaseArgs): {
  aGoesFirst: boolean;
  iniA: number;
  iniD: number;
  event: CombatEvent;
} {
  const { ctx, fA, fD, OE_A, AL_A } = args;
  const { OE_D, AL_D, fatA, fatD, defModsA } = args;
  const { defModsD, passA, passD, psychA, psychD } = args;
  const { dynTraitsA, dynTraitsD } = args;
  const { rng, phase } = ctx;
  const stylePhase = phase as StylePhase;

  const masteryIniA = fA.favorites ? getFavoriteRhythmBonus(fA, OE_A, AL_A) : 0;
  const masteryIniD = fD.favorites ? getFavoriteRhythmBonus(fD, OE_D, AL_D) : 0;

  const iniA = sumInitiative(
    { f: fA, AL: AL_A, matchup: ctx.matchupA, fat: fatA, defMods: defModsA, pass: passA, psych: psychA, dynTraits: dynTraitsA, trainerIniMod: ctx.trainerModsA.iniMod ?? 0, masteryIni: masteryIniA, ctx: ctx, stylePhase: stylePhase }
  );
  const iniD = sumInitiative(
    { f: fD, AL: AL_D, matchup: ctx.matchupD, fat: fatD, defMods: defModsD, pass: passD, psych: psychD, dynTraits: dynTraitsD, trainerIniMod: ctx.trainerModsD.iniMod ?? 0, masteryIni: masteryIniD, ctx: ctx, stylePhase: stylePhase }
  );

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
  // Attribute any pending arena-event initiative mod — the narrator echoes
  // the hazard name so the swing isn't unexplained.
  const iniSources = ctx.arenaEventModSources?.initiative;
  if (iniSources?.length) event.metadata = { ...event.metadata, arenaModSources: [...iniSources] };

  return { aGoesFirst, iniA, iniD, event };
}
