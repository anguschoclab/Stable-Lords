import type { GameState } from '@/types/state.types';
import type { WarriorId, StableId } from '@/types/shared.types';

/** The owning stable's identity for one warrior. */
export interface WarriorOwner {
  stableId: StableId;
  stableName: string;
  isPlayer: boolean;
}

/**
 * Single-entity ownership resolution — the one place "which stable owns this
 * warrior id" is answered. Hot paths bulk-build `state.warriorToStableMap`
 * (pipeline caches); this resolver prefers that map and falls back to a
 * roster+rivals scan when the map is absent (UI/manual paths).
 *
 * For warrior OBJECTS use `isPlayerOwned` (warriorRouting) — it answers from
 * `stableId`/roster membership without an id lookup. Set-membership checks
 * (`playerIds.has`) are list ops, not ownership resolution — they stay put.
 */
export function resolveWarriorOwner(
  state: GameState,
  warriorId: WarriorId | string
): WarriorOwner | null {
  const mapped = state.warriorToStableMap?.get(warriorId);
  if (mapped) {
    const stableName = mapped.isPlayer
      ? state.player.stableName
      : ((state.rivals ?? []).find((r) => r.id === mapped.stableId)?.owner.stableName ?? '');
    return { stableId: mapped.stableId as StableId, stableName, isPlayer: mapped.isPlayer };
  }

  if ((state.roster ?? []).some((w) => w.id === warriorId)) {
    return { stableId: state.player.id, stableName: state.player.stableName, isPlayer: true };
  }
  for (const r of state.rivals ?? []) {
    if ((r.roster ?? []).some((w) => w.id === warriorId)) {
      return { stableId: r.id, stableName: r.owner.stableName, isPlayer: false };
    }
  }
  return null;
}

/** True when the warrior id belongs to the player's stable. */
export function isPlayerOwnedWarrior(state: GameState, warriorId: WarriorId | string): boolean {
  return resolveWarriorOwner(state, warriorId)?.isPlayer === true;
}
