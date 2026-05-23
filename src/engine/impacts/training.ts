/**
 * Training Domain Impacts
 * Handles trainers, hiring pool, training assignments, rest states, and coach dismissals.
 */
import type { GameState, Trainer, TrainingAssignment, RestState } from '@/types/state.types';

/**
 * Apply trainers to state.
 */
export const trainers = (state: GameState, value: Trainer[]) => {
  state.trainers = value;
};

/**
 * Apply hiring pool to state.
 */
export const hiringPool = (state: GameState, value: Trainer[]) => {
  state.hiringPool = value;
};

/**
 * Apply training assignments to state.
 */
export const trainingAssignments = (state: GameState, value: TrainingAssignment[]) => {
  state.trainingAssignments = value;
};

/**
 * Apply rest states to state.
 */
export const restStates = (state: GameState, value: RestState[]) => {
  state.restStates = [...(state.restStates || []), ...value];
};

/**
 * Apply coach dismissals to state.
 */
export const coachDismissed = (state: GameState, value: string[]) => {
  state.coachDismissed = [...(state.coachDismissed || []), ...value];
};

/**
 * Training impact handlers map.
 */
export const trainingHandlers = {
  trainers,
  hiringPool,
  trainingAssignments,
  restStates,
  coachDismissed,
};
