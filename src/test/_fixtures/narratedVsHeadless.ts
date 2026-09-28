import { defaultPlanForWarrior, simulateFight } from '@/engine/simulate';
import type { Warrior } from '@/types/warrior.types';

/** Run one fight twice: narrated and headless, to compare determinism of the two paths. */
export function runNarratedVsHeadless(A: Warrior, D: Warrior, seed: number) {
  const narrated = simulateFight(
    defaultPlanForWarrior(A),
    defaultPlanForWarrior(D),
    A,
    D,
    seed,
    undefined,
    'Clear',
    'standard_arena',
    undefined,
    false
  );
  const headless = simulateFight(
    defaultPlanForWarrior(A),
    defaultPlanForWarrior(D),
    A,
    D,
    seed,
    undefined,
    'Clear',
    'standard_arena',
    undefined,
    true
  );
  return { narrated, headless };
}
