import { defaultPlanForWarrior } from './bout/planDefaults';
import { DEFAULT_LOADOUT } from '@/data/equipment';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import type { Trainer } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { FightPlan, FightOutcome } from '@/types/combat.types';
import type { WeatherType } from '@/types/shared.types';
import type { CrowdMood } from '@/engine/crowdMood';

// Import from split modules
import {
  initializeRng,
  initializeFighters,
  initializeResolutionContext,
} from './simulate/initialization';
import { runSimulationLoop } from './simulate/simulationLoop';
import { generateIntroductions } from './simulate/narrative';
import { processPostFight } from './simulate/postFight';

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
  headless?: boolean
): FightOutcome {
  // 1. Initialize RNG
  const { rng, seed: boutSeed } = initializeRng(providedRng);

  // Narration-only RNG — isolated from combat resolution so flavor
  // draws never shift the mechanical outcome stream.
  const narRngService = new SeededRNGService(boutSeed ^ 0x5f3759df);
  const narRng = () => narRngService.next();

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
    crowdMood
  );
  resCtx.rng = rng;

  // 4. Generate introductions
  const arenaConfig = resCtx.arenaConfig;
  const introLog = headless
    ? []
    : generateIntroductions(
        narRng,
        nameA,
        nameD,
        planA,
        planD,
        warriorA,
        warriorD,
        effectiveWeather,
        arenaId,
        arenaConfig
      );

  // 5. Run simulation loop
  const {
    log: loopLog,
    exchangeLog,
    winner,
    by,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex,
    fightMinutes,
  } = runSimulationLoop(
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
    narRng
  );

  const log = headless ? [] : [...introLog, ...loopLog];

  // 6. Process post-fight: tags, stats, and final outcome assembly
  return processPostFight(
    winner,
    by,
    fA,
    fD,
    nameA,
    nameD,
    rng,
    log,
    exchangeLog,
    headless ?? false,
    fightMinutes,
    causeBucket,
    fatalHitLocation,
    fatalExchangeIndex
  );
}
