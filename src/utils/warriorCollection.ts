import type { Warrior } from '@/types/warrior.types';

/**
 * Collects all known warriors across player roster, graveyard, retired,
 * and rival stables into a single flat array.
 *
 * @param state - The game state containing roster, graveyard, retired, rivals
 * @returns Array of all warriors (no deduplication)
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
 * Later entries overwrite earlier ones (same precedence as collectAllKnownWarriors).
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
