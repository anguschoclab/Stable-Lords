/**
 * Awards Domain Impacts
 * Handles annual awards.
 */
import type { GameState, AnnualAward } from '@/types/state.types';

/**
 * Apply awards to state.
 */
export const awards = (state: GameState, value: AnnualAward[]) => {
  state.awards = [...(state.awards || []), ...value];
};

/**
 * Awards impact handlers map.
 */
export const awardsHandlers = {
  awards,
};
