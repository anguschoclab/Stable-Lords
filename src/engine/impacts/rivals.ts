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
};

/**
 * Rivals impact handlers map.
 */
export const rivalsHandlers = {
  rivalsUpdates,
};
