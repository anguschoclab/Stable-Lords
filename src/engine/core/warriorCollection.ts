/**
 * Warrior Collection Utilities
 * Eliminates DRY violation of "gather all active warriors" pattern across pipeline passes
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { isActive } from '@/engine/warriorStatus';

/**
 * Collects all warriors from player roster and rival stables
 * Optionally filters by a predicate function
 */
export function collectAllWarriors(state: GameState, filter?: (w: Warrior) => boolean): Warrior[] {
  const result: Warrior[] = [];

  // Add player roster warriors
  for (const warrior of state.roster || []) {
    if (!filter || filter(warrior)) {
      result.push(warrior);
    }
  }

  // Add rival roster warriors
  for (const rival of state.rivals || []) {
    for (const warrior of rival.roster || []) {
      if (!filter || filter(warrior)) {
        result.push(warrior);
      }
    }
  }

  return result;
}

/**
 * Collects only active warriors (status === "Active")
 * Most common use case - eliminates the repeated filtering pattern
 */
export function collectAllActiveWarriors(state: GameState): Warrior[] {
  return collectAllWarriors(state, (w) => isActive(w));
}

/**
 * Collects all warriors available for matchmaking
 * (Active and not already booked for upcoming weeks)
 */
export function collectAvailableWarriors(state: GameState, targetWeek: number): Warrior[] {
  // Get all warriors already signed for target week
  const bookedWarriorIds = new Set<string>();

  for (const offer of Object.values(state.boutOffers || {})) {
    if (offer.status === 'Signed' && offer.boutWeek === targetWeek) {
      for (const warriorId of offer.warriorIds || []) {
        bookedWarriorIds.add(warriorId);
      }
    }
  }

  // Return active warriors who aren't booked
  return collectAllWarriors(state, (w) => isActive(w) && !bookedWarriorIds.has(w.id));
}

/**
 * Gets the count of all active warriors in the world
 * Useful for meta calculations and capacity planning
 */
export function countActiveWarriors(state: GameState): number {
  return collectAllActiveWarriors(state).length;
}

/**
 * Collects only healthy active warriors (status === "Active" and no injuries)
 */
export function collectHealthyWarriors(state: GameState): Warrior[] {
  return collectAllWarriors(
    state,
    (w) => isActive(w) && (!w.injuries || w.injuries.length === 0)
  );
}
