import type { GameState, ProgressionState } from '@/types/state.types';

export const progression = (state: GameState, value: ProgressionState) => {
  state.progression = value;
};

export const progressionHandlers = { progression };
