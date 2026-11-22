/**
 * Warrior Status Helpers
 * Single source of truth for warrior lifecycle checks.
 * Import these instead of checking `.status === "Dead"` manually.
 */
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { RestState, TrainingAssignment } from '@/types/state.types';
import { isTooInjuredToFight } from '@/engine/injuries';
import { isExhausted } from '@/engine/core/fatigueUtils';

/** Whether a warrior is dead (killed in combat) */
export function isDead(w: Pick<Warrior, 'status'>): boolean {
  return w.status === 'Dead';
}

/** Whether a warrior has retired */
export function isRetired(w: Pick<Warrior, 'status'>): boolean {
  return w.status === 'Retired';
}

/** Whether a warrior is on the active roster (not dead or retired) */
export function isActive(w: Pick<Warrior, 'status'>): boolean {
  return w.status === 'Active';
}

// ⚡ Bolt: `deadWarriorIds` is deliberately NEVER truncated (TRUNCATION_CAPS —
// it is the save-lifetime liveness registry) and both it and `graveyard` are
// append-only-by-replacement: every writer assigns a new array rather than
// pushing in place (same invariant as arenaHistory's fightsByWarrior index in
// historyUtils.ts). The built set is therefore memoized on the two array
// identities — deadIdSet ran ~3× per resolved tournament bout (findWarriorById
// overlay + inactiveIdSet) plus once per weekly bout validation, each build
// re-hashing the entire unbounded registry (~80µs at 3.2k ids → ~15ms/bracket).
const deadIdSetCache = new WeakMap<readonly unknown[], WeakMap<readonly unknown[], Set<string>>>();
const NO_LIST: readonly unknown[] = Object.freeze([]);

/**
 * Every warrior id that has ever died under `state` — the persistent
 * `deadWarriorIds` registry ∪ the (truncating) `graveyard`. Stale snapshots
 * (tournament participants, cached maps) keep their selection-time 'Active'
 * status forever, so set membership is the liveness authority wherever a
 * warrior object might be stale.
 *
 * Returns a memoized set SHARED by all callers seeing the same array
 * references — treat it as read-only (clone before mutating; the
 * `ReadonlySet` return type makes mutation a compile error). Inputs that
 * are not arrays-or-absent (defensive: malformed data) skip the cache and
 * build exactly as before.
 */
export function deadIdSet(state: {
  deadWarriorIds?: string[];
  graveyard?: { id: string }[];
}): ReadonlySet<string> {
  const ids = state.deadWarriorIds;
  const graves = state.graveyard;
  const cacheable =
    (ids === undefined || Array.isArray(ids)) && (graves === undefined || Array.isArray(graves));
  if (cacheable) {
    const hit = deadIdSetCache
      .get((ids ?? NO_LIST) as readonly unknown[])
      ?.get((graves ?? NO_LIST) as readonly unknown[]);
    if (hit) return hit;
  }
  const built = new Set<string>([...(ids ?? []), ...(graves ?? []).map((w) => w.id as string)]);
  if (cacheable) {
    const idsKey = (ids ?? NO_LIST) as readonly unknown[];
    let inner = deadIdSetCache.get(idsKey);
    if (!inner) deadIdSetCache.set(idsKey, (inner = new WeakMap()));
    inner.set((graves ?? NO_LIST) as readonly unknown[], built);
  }
  return built;
}

/**
 * Whether a warrior is active AND healthy enough to fight this week.
 * Enforces a fatigue ceiling of 60 (>60 = exhausted) for regular bouts.
 */
export function isFightReady(w: Warrior, isTournament: boolean = false): boolean {
  if (!isActive(w)) return false;

  // ── Tournament Adrenaline ──
  // Fatigue is ignored during tournament weeks to allow for multi-round progression.
  if (!isTournament && isExhausted(w.fatigue || 0)) return false;

  const injObjs = (w.injuries || []).filter((i): i is InjuryData => typeof i !== 'string');
  return !isTooInjuredToFight(injObjs);
}

/** Whether the warrior can be offered a bout for `targetWeek` — active, uninjured, not resting or assigned to training. */
export function isBookable(
  w: Warrior,
  opts: {
    restStates: RestState[];
    trainingAssignments: TrainingAssignment[];
    targetWeek: number;
  }
): boolean {
  if (!isActive(w)) return false;
  if (w.isDead) return false;
  if (opts.restStates.some((r) => r.warriorId === w.id && r.restUntilWeek > opts.targetWeek))
    return false;
  const injObjs = (w.injuries || []).filter((i): i is InjuryData => typeof i !== 'string');
  if (isTooInjuredToFight(injObjs)) return false;
  if (opts.trainingAssignments.some((a) => a.warriorId === w.id)) return false;
  return true;
}
