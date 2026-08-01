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
  // NF2 fix: keep rivalMap cache in sync with rivals array
  if (state.rivalMap) {
    for (const [id, update] of value) {
      const cached = state.rivalMap.get(id);
      if (cached) {
        state.rivalMap.set(id, { ...cached, ...update });
      }
    }
  }
};

/**
 * Rivals impact handlers map.
 */
export const rivalsHandlers = {
  rivalsUpdates,
};
