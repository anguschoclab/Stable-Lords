import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';
import { type StateImpact } from '@/engine/impacts';
import { isPlayerOwned } from './warriorRouting';

/**
 * lastBoutWeek stamps for both combatants — the single emitter consumed by
 * the weekly pipeline bout path and the interactive tournament resolution
 * path. Rival-owned combatants get a per-warrior patch (not a roster
 * rebuild): a merged whole-roster write would clobber that bout's record,
 * injury, XP, and death updates for every other warrior on the stable.
 */
export function stampLastBoutWeek(
  state: GameState,
  wA: Warrior,
  wD: Warrior,
  week: number
): StateImpact {
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>([
    [wA.id, { lastBoutWeek: week }],
    [wD.id, { lastBoutWeek: week }],
  ]);
  const rivalWarriorPatches = new Map<WarriorId, Partial<Warrior>>();
  for (const w of [wA, wD]) {
    if (!isPlayerOwned(state, w)) rivalWarriorPatches.set(w.id, { lastBoutWeek: week });
  }
  return { rosterUpdates, rivalWarriorPatches };
}
