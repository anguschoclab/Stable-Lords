import type {
  GameState,
  Warrior,
  RivalStableData,
  Rivalry,
  OwnerGrudge,
} from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts/types';
import type { WarriorId } from '@/types/shared.types';
import { getPairKey } from '@/utils/keyUtils';
import { clearWarriorCache } from '@/engine/core/warriorLookup';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';

/**
 * Impact keys that can change the identity or membership of the data the week
 * caches index: player roster, rival rosters/stables, rivalries, owner
 * grudges. Conservative on purpose — over-inclusion costs one rebuild,
 * under-inclusion silently serves stale map entries until the next boundary.
 */
const CACHE_TOUCHING_KEYS = new Set<keyof StateImpact>([
  'rosterUpdates',
  'rosterRemovals',
  'rosterAdditions',
  'warriorEpithets',
  'retired',
  'graveyard',
  'deadWarriorIds',
  'rivalsUpdates',
  'rivalWarriorPatches',
  'rivalRosterRemovals',
  'rivalReplacements',
  'rivalsAdditions',
  'rivalsRemovals',
  'rivalries',
  'ownerGrudges',
]);

/**
 * Whether resolving these impacts could invalidate the week caches. Impact
 * handlers replace warrior/stable objects in place, so a boundary that
 * applied none of the cache-touching keys leaves every map still accurate —
 * the caller may skip buildWeekCaches entirely.
 */
export function impactsAffectWeekCaches(impacts: StateImpact[]): boolean {
  return impacts.some(
    (impact) =>
      impact != null && Object.keys(impact).some((k) => CACHE_TOUCHING_KEYS.has(k as keyof StateImpact))
  );
}

/**
 * Builds warrior and rival maps once per week for O(1) lookups.
 * Called at the start of advanceWeek and re-run after every impact-resolution
 * boundary so caches never point at pre-impact object identities (impact
 * handlers replace objects — e.g. rosterUpdates produces a new Warrior).
 */
export function buildWeekCaches(state: GameState): void {
  telemetry.increment(TelemetryEvents.WEEK_CACHE_REBUILDS);
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
    rivalryMap.set(getPairKey(rv.stableIdA, rv.stableIdB), rv)
  );
  state.rivalryMap = rivalryMap;

  const grudgeMap = new Map<string, OwnerGrudge>();
  (state.ownerGrudges || []).forEach((g) =>
    grudgeMap.set(getPairKey(g.ownerIdA, g.ownerIdB), g)
  );
  state.grudgeMap = grudgeMap;
}
