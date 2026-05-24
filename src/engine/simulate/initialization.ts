/**
 * Simulation Initialization - RNG setup, fighter state, weather effects
 */
import { createFighterState } from '../bout/fighterState';
import { DEFAULT_LOADOUT, checkWeaponRequirements } from '@/data/equipment';
import { getTrainerMods } from '../combat/mechanics/simulateHelpers';
import {
  getWeatherEffect,
  resolveEffectiveWeather,
} from '../combat/mechanics/weatherEffects';
import { getArenaById } from '@/data/arenas';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { Trainer } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan } from '@/types/combat.types';
import type { WeatherType, DistanceRange, ArenaZone } from '@/types/shared.types';
import type { CrowdMood } from '@/engine/crowdMood';
import type { ResolutionContext } from '../combat/resolution/resolution';
import { getMatchupBonus } from '../combat/mechanics/combatConstants';

/**
 * Per-mood kill-window deltas.
 */
const CROWD_KILL_BONUS: Record<CrowdMood, number> = {
  Calm: 0,
  Bloodthirsty: 0.004,
  Theatrical: 0,
  Solemn: -0.002,
  Festive: 0,
};

/**
 * Initialize RNG service from provided seed or generate new one.
 */
export function initializeRng(providedRng?: IRNGService | number): { rngService: IRNGService; rng: () => number } {
  let rngService: IRNGService;
  if (providedRng && typeof providedRng === 'object') {
    rngService = providedRng;
  } else {
    const seed = (typeof providedRng === 'number' ? providedRng : crypto.getRandomValues(new Uint32Array(1))[0]) as number;
    rngService = new SeededRNGService(seed);
  }
  const rng = () => rngService.next();
  return { rngService, rng };
}

/**
 * Initialize fighter states with weather effects.
 */
export function initializeFighters(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  trainers?: Trainer[],
  weather: WeatherType = 'Clear',
  arenaId: string = 'standard_arena'
): { fA: ReturnType<typeof createFighterState>; fD: ReturnType<typeof createFighterState>; effectiveWeather: WeatherType } {
  const arena = getArenaById(arenaId);
  const effectiveWeather = resolveEffectiveWeather(weather, arena.tags);

  const fA = createFighterState('A', planA, warriorA, trainers);
  const fD = createFighterState('D', planD, warriorD, trainers);

  if (effectiveWeather === 'Blood Moon') {
    fA.plan = { ...fA.plan, killDesire: Math.min(10, (fA.plan.killDesire ?? 5) + 3) };
    fD.plan = { ...fD.plan, killDesire: Math.min(10, (fD.plan.killDesire ?? 5) + 3) };
  }

  return { fA, fD, effectiveWeather };
}

/**
 * Initialize resolution context with all modifiers.
 */
export function initializeResolutionContext(
  planA: FightPlan,
  planD: FightPlan,
  effectiveWeather: WeatherType,
  warriorA?: Warrior,
  warriorD?: Warrior,
  trainers?: Trainer[],
  arenaId: string = 'standard_arena',
  crowdMood?: CrowdMood
): ResolutionContext {
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  const modsA = trainers
    ? getTrainerMods(trainers, planA.style)
    : { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };
  const modsD = trainers
    ? getTrainerMods(trainers, planD.style)
    : { attMod: 0, defMod: 0, iniMod: 0, parMod: 0, decMod: 0, endMod: 0, healMod: 0 };

  const weaponReqA = checkWeaponRequirements(
    weaponA,
    warriorA?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 }
  );
  const weaponReqD = checkWeaponRequirements(
    weaponD,
    warriorD?.attributes ?? { ST: 10, SZ: 10, WT: 10, DF: 10 }
  );

  const arenaConfig = getArenaById(arenaId);

  return {
    rng: () => 0, // Placeholder, will be set by caller
    phase: 'OPENING',
    exchange: 0,
    weather: effectiveWeather,
    weatherEffect: getWeatherEffect(effectiveWeather),
    matchupA: getMatchupBonus(planA.style, planD.style),
    matchupD: getMatchupBonus(planD.style, planA.style),
    trainerModsA: modsA,
    trainerModsD: modsD,
    trainers: trainers ?? [],
    weaponReqA: {
      endurancePenalty: weaponReqA.endurancePenalty,
      attPenalty: weaponReqA.attPenalty,
    },
    weaponReqD: {
      endurancePenalty: weaponReqD.endurancePenalty,
      attPenalty: weaponReqD.attPenalty,
    },
    tacticStreakA: 0,
    tacticStreakD: 0,
    range: 'Striking' as DistanceRange,
    zone: 'Center' as ArenaZone,
    arenaConfig,
    surfaceMod: arenaConfig.surfaceMod,
    pushedFighter: undefined,
    crowdKillBonus: crowdMood ? CROWD_KILL_BONUS[crowdMood] : 0,
  };
}

export { CROWD_KILL_BONUS };
