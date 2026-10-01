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

/** Sum one fighter's initiative: skills + tactics + passives + mods. Pure — no RNG. */
function sumInitiative(
  f: FighterState,
  AL: number,
  matchup: number,
  fat: number,
  defMods: DefensiveMods,
  pass: StylePassiveResult,
  psych: PsychStateMod,
  dynTraits: DynamicTraitMods,
  trainerIniMod: number,
  masteryIni: number,
  ctx: ResolutionContext,
  stylePhase: StylePhase
): number {
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
    styleWeatherMod.initiativeMod +
    getWeaponInitiativeMod(f.weaponId) +
    dynTraits.iniMod
  );
}

/**
 * Resolve the initiative phase — determines which fighter attacks first.
 */
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

  const iniA = sumInitiative(
    fA,
    AL_A,
    ctx.matchupA,
    fatA,
    defModsA,
    passA,
    psychA,
    dynTraitsA,
    ctx.trainerModsA.iniMod ?? 0,
    masteryIniA,
    ctx,
    stylePhase
  );
  const iniD = sumInitiative(
    fD,
    AL_D,
    ctx.matchupD,
    fatD,
    defModsD,
    passD,
    psychD,
    dynTraitsD,
    ctx.trainerModsD.iniMod ?? 0,
    masteryIniD,
    ctx,
    stylePhase
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

  return { aGoesFirst, iniA, iniD, event };
}
