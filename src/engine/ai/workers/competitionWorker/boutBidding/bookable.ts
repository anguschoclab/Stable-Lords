import type { Warrior, RestState, TrainingAssignment } from '@/types/state.types';
import { isBookable } from '@/engine/warrior/warriorStatus';

/**
 * Whether a warrior is free to be booked: active, uninjured, and not holding
 * a training assignment on its owning stable's list (G19 — rival assignment
 * lists are consulted for rival-owned warriors).
 */
export function bookable(
  warrior: Warrior,
  opts: {
    trainingAssignments: TrainingAssignment[] | undefined;
    restStates?: RestState[] | undefined;
    targetWeek: number;
  }
): boolean {
  return isBookable(warrior, {
    restStates: opts.restStates ?? [],
    trainingAssignments: opts.trainingAssignments ?? [],
    targetWeek: opts.targetWeek,
  });
}
