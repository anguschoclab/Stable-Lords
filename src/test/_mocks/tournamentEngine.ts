import { vi } from 'vitest';
import type { Warrior } from '@/types/state.types';

/**
 * Shared stub for the @/engine barrel — aiPlanForWarrior defaults to
 * killDesire 7. Inert in the tournament graph today (rivalFightPlan resolves
 * the plan generator via ./coreGenerator, not the barrel); kept so split
 * specs stay behavior-identical to the consolidated file they came from.
 */
export const aiPlanForWarrior = vi.fn((w: Warrior) => ({
  killDesire: 7,
  weapon: 'Broadsword',
  planStyle: w.style,
}));
