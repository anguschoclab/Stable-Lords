import type { GameState, Warrior, RivalStableData, Rivalry, OwnerGrudge } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { getStablePairKey } from '@/utils/keyUtils';
import { clearWarriorCache } from '@/engine/core/warriorLookup';

/**
 * Builds warrior and rival maps once per week for O(1) lookups.
 * Called at the start of advanceWeek and re-run after every impact-resolution
 * boundary so caches never point at pre-impact object identities (impact
 * handlers replace objects — e.g. rosterUpdates produces a new Warrior).
 */
export function buildWeekCaches(state: GameState): void {
  // The WeakMap in warriorLookup keys on the state object, which survives
  // stage boundaries mid-tick — drop it so post-impact reads never see
  // pre-resolution rosters.
  clearWarriorCache();

  const warriorMap = new Map<WarriorId, Warrior>();
  state.roster.forEach((w) => warriorMap.set(w.id, w));
  (state.rivals || []).forEach((r) => r.roster.forEach((w) => warriorMap.set(w.id, w)));
  state.warriorMap = warriorMap;

  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  state.roster.forEach((w) =>
    warriorToStableMap.set(w.id, { stableId: state.player.id, isPlayer: true })
  );
  (state.rivals || []).forEach((r) =>
    r.roster.forEach((w) => warriorToStableMap.set(w.id, { stableId: r.id, isPlayer: false }))
  );
  state.warriorToStableMap = warriorToStableMap;

  const rivalMap = new Map<string, RivalStableData>();
  (state.rivals || []).forEach((r) => rivalMap.set(r.id, r));
  state.rivalMap = rivalMap;

  const rivalryMap = new Map<string, Rivalry>();
  (state.rivalries || []).forEach((rv) =>
    rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), rv)
  );
  state.rivalryMap = rivalryMap;

  const grudgeMap = new Map<string, OwnerGrudge>();
  (state.ownerGrudges || []).forEach((g) =>
    grudgeMap.set(getStablePairKey(g.ownerIdA, g.ownerIdB), g)
  );
  state.grudgeMap = grudgeMap;
}
