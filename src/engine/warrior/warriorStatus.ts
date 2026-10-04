/**
 * Warrior Status Helpers
 * Single source of truth for warrior lifecycle checks.
 * Import these instead of checking `.status === "Dead"` manually.
 */
import type { Warrior, InjuryData } from '@/types/warrior.types';
import type { GameState, RestState, TrainingAssignment } from '@/types/state.types';
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

/**
 * Every warrior id that has ever died under `state` — the persistent
 * `deadWarriorIds` registry ∪ the (truncating) `graveyard`. Stale snapshots
 * (tournament participants, cached maps) keep their selection-time 'Active'
 * status forever, so set membership is the liveness authority wherever a
 * warrior object might be stale.
 */
export function deadIdSet(state: GameState): Set<string> {
  return new Set<string>([
    ...(state.deadWarriorIds ?? []),
    ...(state.graveyard ?? []).map((w) => w.id as string),
  ]);
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

/**
 *
 */
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
