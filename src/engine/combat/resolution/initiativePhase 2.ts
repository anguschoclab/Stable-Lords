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
