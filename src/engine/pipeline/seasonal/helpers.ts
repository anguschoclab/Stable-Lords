import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';

/**
 * Active warriors, optionally restricted to those carrying no injuries.
 * NOTE: preserves the RNG call order of the inlined code it replaces
 * (uuid before pick/next), keeping seeded results deterministic.
 */
export function getActiveWarriors(state: GameState, healthyOnly = false): Warrior[] {
  return state.roster.filter(
    (w) => w.status === 'Active' && (!healthyOnly || !w.injuries || w.injuries.length === 0)
  );
}
