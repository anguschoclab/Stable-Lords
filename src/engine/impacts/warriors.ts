/**
 * Warriors Domain Impacts
 * Handles roster updates, removals, graveyard, and retirement-related state impacts.
 */
import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId } from '@/types/shared.types';

/**
 * Apply roster updates to state.
 */
export const rosterUpdates = (state: GameState, value: Map<WarriorId, Partial<Warrior>>) => {
  if (value.size === 0) return;
  state.roster = state.roster.map((w) => {
    const update = value.get(w.id);
    return update ? { ...w, ...update } : w;
  });
};

/**
 * Apply roster removals to state.
 */
export const rosterRemovals = (state: GameState, value: WarriorId[]) => {
  if (value.length === 0) return;
  state.roster = state.roster.filter((w) => !value.includes(w.id));
};

export const rosterAdditions = (state: GameState, value: Warrior[]) => {
  state.roster = [...state.roster, ...value];
};

/**
 * Apply graveyard additions to state.
 */
export const graveyard = (state: GameState, value: Warrior[]) => {
  state.graveyard = [...(state.graveyard || []), ...value];
};

/**
 * Apply retired warriors to state.
 */
export const retired = (state: GameState, value: Warrior[]) => {
  state.retired = [...(state.retired || []), ...value];
};

/**
 * Warriors impact handlers map.
 */
export const warriorsHandlers = {
  rosterUpdates,
  rosterRemovals,
  rosterAdditions,
  graveyard,
  retired,
};
