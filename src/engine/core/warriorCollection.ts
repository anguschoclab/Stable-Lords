/**
 * Warrior Collection Utilities
 * Eliminates DRY violation of "gather all active warriors" pattern across pipeline passes
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { isActive } from '@/engine/warriorStatus';
import { boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';

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

  const offers = state.boutOffers;
  if (offers) {
    for (const offer of Object.values(offers)) {
      if (!offer) continue;
      if (offer.status === 'Signed' && boutOfferAbsoluteWeek(offer) === targetWeek) {
        for (const warriorId of offer.warriorIds || []) {
          bookedWarriorIds.add(warriorId);
        }
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
 * Collects all known warriors across player roster, graveyard, retired,
 * and rival stables into a single flat array.
 */
export function collectAllKnownWarriors(state: {
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  rivals: { roster: Warrior[] }[];
}): Warrior[] {
  return [
    ...state.roster,
    ...state.graveyard,
    ...state.retired,
    ...(state.rivals ?? []).flatMap((r) => r.roster),
  ];
}

/**
 * Builds a Map of warrior id → warrior for fast lookups.
 * Includes all warriors (roster, graveyard, retired, rivals).
 * Later entries overwrite earlier ones.
 */
export function buildWarriorMap(state: {
  roster: Warrior[];
  graveyard: Warrior[];
  retired: Warrior[];
  rivals: { roster: Warrior[] }[];
}): Map<string, Warrior> {
  const map = new Map<string, Warrior>();
  for (const w of collectAllKnownWarriors(state)) {
    map.set(w.id, w);
  }
  return map;
}

/**
 * Collects healthy active warriors (status === "Active" and no injuries)
 */
export function collectHealthyWarriors(state: GameState): Warrior[] {
  return collectAllWarriors(state, (w) => isActive(w) && (!w.injuries || w.injuries.length === 0));
}
