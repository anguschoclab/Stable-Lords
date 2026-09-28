import { defaultPlanForWarrior } from '../bout/planDefaults';
import { DEFAULT_LOADOUT } from '@/data/equipment';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import type { Trainer } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan, FightOutcome } from '@/types/combat.types';
import type { WeatherType } from '@/types/shared.types';
import type { CrowdMood } from '@/engine/bout/crowdMood';

// Import from split modules
import {
  initializeRng,
  initializeFighters,
  initializeResolutionContext,
} from './initialization';
import { runSimulationLoop } from './simulationLoop';
import { generateIntroductions } from './narrative';
import { processPostFight } from './postFight';

export { defaultPlanForWarrior };

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
function prepareBout(
  planA: FightPlan,
  planD: FightPlan,
  warriorA: Warrior | undefined,
  warriorD: Warrior | undefined,
  providedRng: IRNGService | number | undefined,
  trainers: Trainer[] | undefined,
  weather: WeatherType,
  arenaId: string,
  crowdMood: CrowdMood | undefined,
  deathRateMult: number | undefined
) {
  // 1. Initialize RNG
  const { rng, seed: boutSeed } = initializeRng(providedRng);

  // Narration-only RNG — isolated from combat resolution so flavor
  // draws never shift the mechanical outcome stream.
  const narRngService = new SeededRNGService(boutSeed ^ 0x5f3759df);

  const nameA = warriorA?.name ?? 'Attacker';
  const nameD = warriorD?.name ?? 'Defender';
  const weaponA = (warriorA?.equipment ?? DEFAULT_LOADOUT).weapon;
  const weaponD = (warriorD?.equipment ?? DEFAULT_LOADOUT).weapon;

  // 2. Initialize fighters with weather effects
  const { fA, fD, effectiveWeather } = initializeFighters(
    planA,
    planD,
    warriorA,
    warriorD,
    trainers,
    weather,
    arenaId
  );

  // 3. Initialize resolution context
  const resCtx = initializeResolutionContext(
    planA,
    planD,
    effectiveWeather,
    warriorA,
    warriorD,
    trainers,
    arenaId,
    crowdMood,
    deathRateMult
  );
  resCtx.rng = rng;

  return { rng, narRngService, nameA, nameD, weaponA, weaponD, fA, fD, effectiveWeather, resCtx };
}

type BoutPrep = ReturnType<typeof prepareBout>;

/** Introductions + simulation loop; returns the merged log and loop outputs. */
function runBoutLoop(
  prep: BoutPrep,
  planA: FightPlan,
  planD: FightPlan,
  warriorA: Warrior | undefined,
  warriorD: Warrior | undefined,
  arenaId: string,
  crowdMood: CrowdMood | undefined,
  headless: boolean | undefined
) {
  const { narRngService, nameA, nameD, weaponA, weaponD, fA, fD, effectiveWeather, resCtx } = prep;

  // 4. Generate introductions
  const introLog = headless
    ? []
    : generateIntroductions(
        narRngService,
        nameA,
        nameD,
        planA,
        planD,
        warriorA,
        warriorD,
        effectiveWeather,
        arenaId,
        resCtx.arenaConfig
      );

  // 5. Run simulation loop
  const loop = runSimulationLoop(
    fA,
    fD,
    resCtx,
    nameA,
    nameD,
    weaponA,
    weaponD,
    warriorA,
    warriorD,
    planA,
    planD,
    crowdMood,
    headless ?? false,
    narRngService
  );

  return { ...loop, log: headless ? [] : [...introLog, ...loop.log] };
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
export function simulateFight(
  planA: FightPlan,
  planD: FightPlan,
  warriorA?: Warrior,
  warriorD?: Warrior,
  providedRng?: IRNGService | number,
  trainers?: Trainer[],
  weather: WeatherType = 'Clear',
  arenaId: string = 'standard_arena',
  crowdMood?: CrowdMood,
  headless?: boolean,
  deathRateMult?: number
): FightOutcome {
  const prep = prepareBout(
    planA,
    planD,
    warriorA,
    warriorD,
    providedRng,
    trainers,
    weather,
    arenaId,
    crowdMood,
    deathRateMult
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
  } = runBoutLoop(prep, planA, planD, warriorA, warriorD, arenaId, crowdMood, headless);

  // 6. Process post-fight: tags, stats, and final outcome assembly
  return processPostFight(
    winner,
    by,
    prep.fA,
    prep.fD,
    prep.nameA,
    prep.nameD,
    prep.rng,
    log,
    exchangeLog,
    headless ?? false,
    fightMinutes,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex
  );
}
