import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import type { Warrior } from '@/types/warrior.types';

/** Run one fight twice: narrated and headless, to compare determinism of the two paths. */
export function runNarratedVsHeadless(A: Warrior, D: Warrior, seed: number) {
  const narrated = simulateFight(
    { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: seed, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: false }
  );
  const headless = simulateFight(
    { planA: defaultPlanForWarrior(A), planD: defaultPlanForWarrior(D), warriorA: A, warriorD: D, providedRng: seed, trainers: undefined, weather: 'Clear', arenaId: 'standard_arena', crowdMood: undefined, headless: true }
  );
  return { narrated, headless };
}
