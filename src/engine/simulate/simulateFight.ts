import { defaultPlanForWarrior } from '../bout/planDefaults';
import { DEFAULT_LOADOUT } from '@/data/equipment';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNG } from '@/utils/random';
import type { Trainer } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan, FightOutcome } from '@/types/combat.types';
import type { WeatherType } from '@/types/shared.types';
import type { CrowdMood } from '@/engine/bout/crowdMood';

// Import from split modules
import { initializeRng, initializeFighters, initializeResolutionContext } from './initialization';
import { runSimulationLoop } from './simulationLoop';
import { generateIntroductions } from './narrative';
import { processPostFight } from './postFight';

export { defaultPlanForWarrior };

interface PrepareBoutArgs {
  planA: FightPlan;
  planD: FightPlan;
  warriorA: Warrior | undefined;
  warriorD: Warrior | undefined;
  providedRng: IRNGService | number | undefined;
  trainers: Trainer[] | undefined;
  weather: WeatherType;
  arenaId: string;
  crowdMood: CrowdMood | undefined;
  deathRateMult: number | undefined;
}

/**
 * Simulates a fight between two plans/warriors.
 *
 * @param planA - Strategy for fighter A
 * @param planD - Strategy for fighter D
 * @param warriorA - Warrior data for A (optional)
 * @param warriorD - Warrior data for D (optional)
 * @param providedRng - Seeded RNG service or numeric seed (optional, generates one if missing)
 * @param trainers - Active trainers providing global modifiers
 * @param weather - Current weather conditions
 * @param arenaId - Identifier for the arena where the bout takes place
 * @param crowdMood - Current mood of the arena crowd
 * @returns Detailed outcome of the fight simulation
 */
/** Per-bout setup: RNG streams, initialized fighters, and resolution context. */
function prepareBout(args: PrepareBoutArgs) {
  const { planA, planD, warriorA, warriorD, providedRng } = args;
  const { trainers, weather, arenaId, crowdMood, deathRateMult } = args;
  // 1. Initialize RNG
  const { rng, seed: boutSeed } = initializeRng(providedRng);

  // Narration-only RNG — isolated from combat resolution so flavor
  // draws never shift the mechanical outcome stream.
  const narRngService = new SeededRNG(boutSeed ^ 0x5f3759df);

  const nameA = warriorA?.name ?? 'Attacker';
  const nameD = warriorD?.name ?? 'Defender';
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  // 2. Initialize fighters with weather effects
  const { fA, fD, effectiveWeather } = initializeFighters(
    { planA: planA, planD: planD, warriorA: warriorA, warriorD: warriorD, trainers: trainers, weather: weather, arenaId: arenaId }
  );

  // 3. Initialize resolution context
  const resCtx = initializeResolutionContext(
    { planA: planA, planD: planD, effectiveWeather: effectiveWeather, warriorA: warriorA, warriorD: warriorD, trainers: trainers, arenaId: arenaId, crowdMood: crowdMood, deathRateMult: deathRateMult }
  );
  resCtx.rng = rng;

  return { rng, narRngService, nameA, nameD, weaponA, weaponD, fA, fD, effectiveWeather, resCtx };
}

type BoutPrep = ReturnType<typeof prepareBout>;

interface RunBoutLoopArgs {
  prep: BoutPrep;
  planA: FightPlan;
  planD: FightPlan;
  warriorA: Warrior | undefined;
  warriorD: Warrior | undefined;
  arenaId: string;
  crowdMood: CrowdMood | undefined;
  headless: boolean | undefined;
}

/** Introductions + simulation loop; returns the merged log and loop outputs. */
function runBoutLoop(args: RunBoutLoopArgs) {
  const { prep, planA, planD, warriorA, warriorD } = args;
  const { arenaId, crowdMood, headless } = args;
  const { narRngService, nameA, nameD, weaponA, weaponD, fA, fD, effectiveWeather, resCtx } = prep;

  // 4. Generate introductions
  const introLog = headless
    ? []
    : generateIntroductions(
        { rng: narRngService, nameA: nameA, nameD: nameD, planA: planA, planD: planD, warriorA: warriorA, warriorD: warriorD, weather: effectiveWeather, arenaId: arenaId, arenaConfig: resCtx.arenaConfig }
      );

  // 5. Run simulation loop
  const loop = runSimulationLoop(
    { fA: fA, fD: fD, resCtx: resCtx, nameA: nameA, nameD: nameD, weaponA: weaponA, weaponD: weaponD, warriorA: warriorA, warriorD: warriorD, planA: planA, planD: planD, crowdMood: crowdMood, headless: headless ?? false, narRng: narRngService }
  );

  return { ...loop, log: headless ? [] : [...introLog, ...loop.log] };
}

/**
 *
 */
export interface SimulateFightArgs {
  planA: FightPlan;
  planD: FightPlan;
  warriorA?: Warrior;
  warriorD?: Warrior;
  providedRng?: IRNGService | number;
  trainers?: Trainer[];
  weather?: WeatherType;
  arenaId?: string;
  crowdMood?: CrowdMood;
  headless?: boolean;
  deathRateMult?: number;
}

/**
 * Simulates a fight between two plans/warriors.
 *
 * @param args.planA - Strategy for fighter A
 * @param args.planD - Strategy for fighter D
 * @param args.warriorA - Warrior data for A (optional)
 * @param args.warriorD - Warrior data for D (optional)
 * @param args.providedRng - Seeded RNG service or numeric seed (optional, generates one if missing)
 * @param args.trainers - Active trainers providing global modifiers
 * @param args.weather - Current weather conditions
 * @param args.arenaId - Identifier for the arena where the bout takes place
 * @param args.crowdMood - Current mood of the arena crowd
 * @returns Detailed outcome of the fight simulation
 */
export function simulateFight(args: SimulateFightArgs): FightOutcome {
  const { planA, planD, warriorA, warriorD, providedRng } = args;
  const { trainers, weather = 'Clear', arenaId = 'standard_arena', crowdMood, headless } = args;
  const { deathRateMult } = args;
  const prep = prepareBout(
    { planA: planA, planD: planD, warriorA: warriorA, warriorD: warriorD, providedRng: providedRng, trainers: trainers, weather: weather, arenaId: arenaId, crowdMood: crowdMood, deathRateMult: deathRateMult }
  );

  const {
    log,
    exchangeLog,
    winner,
    by,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
    fightMinutes,
  } = runBoutLoop({ prep: prep, planA: planA, planD: planD, warriorA: warriorA, warriorD: warriorD, arenaId: arenaId, crowdMood: crowdMood, headless: headless });

  // 6. Process post-fight: tags, stats, and final outcome assembly
  return processPostFight(
    { winner: winner, by: by, fA: prep.fA, fD: prep.fD, nameA: prep.nameA, nameD: prep.nameD, rng: prep.rng, log: log, exchangeLog: exchangeLog, headless: headless ?? false, fightMinutes: fightMinutes, causeBucket: causeBucket, fatalHitLocation: fatalHitLocation, fatalExchangeIndex: fatalExchangeIndex }
  );
}
