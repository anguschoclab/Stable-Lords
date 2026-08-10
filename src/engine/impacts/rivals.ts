/**
 * Rivals Domain Impacts
 * Handles rival stable updates.
 */
import type { GameState, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';

/**
 * Apply rivals updates to state.
 */
export const rivalsUpdates = (state: GameState, value: Map<StableId, Partial<RivalStableData>>) => {
  if (value.size === 0) return;
  state.rivals = state.rivals.map((r) => {
    const update = value.get(r.id);
    return update ? { ...r, ...update } : r;
  });
  // Rebuild rivalMap cache from the updated rivals array to guarantee sync
  if (state.rivalMap) {
    state.rivalMap = new Map(state.rivals.map((r) => [r.id, r] as const));
  }
};

/**
 * Rivals impact handlers map.
 */
export const rivalsHandlers = {
  rivalsUpdates,
};
