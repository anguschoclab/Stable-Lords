import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';

/** True when the warrior belongs to the player's stable. */
export function isPlayerOwned(s: GameState, warrior: Warrior): boolean {
  return s.player?.id === warrior.stableId || (s.roster || []).some((w) => w.id === warrior.id);
}

/**
 * Only the top-level fields of `after` that differ (by reference) from
 * `before`. Bout handlers derive full warrior objects from the same pre-bout
 * snapshot; patching with the full object would let a later handler's stale
 * copy of an unrelated field (e.g. `career`) overwrite an earlier handler's
 * real change. Diffing keeps every handler's patch to what it changed.
 */
function changedFields(before: Warrior, after: Partial<Warrior>): Partial<Warrior> {
  const out: Record<string, unknown> = {};
  const b = before as unknown as Record<string, unknown>;
  for (const [k, v] of Object.entries(after)) {
    if (b[k] !== v) out[k] = v;
  }
  return out as Partial<Warrior>;
}

/**
 * Queue a rival-owned warrior's post-bout change as a per-warrior patch,
 * merged with any earlier patch for the same warrior this week.
 */
export function patchRivalWarrior(
  patches: Map<WarriorId, Partial<Warrior>>,
  before: Warrior,
  after: Partial<Warrior>
): void {
  const diff = changedFields(before, after);
  if (Object.keys(diff).length === 0) return;
  patches.set(before.id, { ...(patches.get(before.id) ?? {}), ...diff });
}
