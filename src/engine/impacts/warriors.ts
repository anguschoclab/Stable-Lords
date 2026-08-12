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

  // Directly modify the roster without mapping if we only have a few updates
  // and the array is large, or just map if value has many updates
  if (value.size === 1) {
    const entries = Array.from(value.entries());
    if (!entries[0]) return;
    const entry = entries[0];
    const id = entry[0];
    const update = entry[1];
    const index = state.roster.findIndex((w) => w.id === id);
    if (index !== -1) {
      const nextRoster = [...state.roster];
      nextRoster[index] = { ...nextRoster[index], ...update } as Warrior;
      state.roster = nextRoster;
    }
  } else {
    state.roster = state.roster.map((w) => {
      const update = value.get(w.id);
      return update ? ({ ...w, ...update } as Warrior) : w;
    });
  }
};

/**
 * Apply roster removals to state.
 */
export const rosterRemovals = (state: GameState, value: WarriorId[]) => {
  if (value.length === 0) return;
  state.roster = state.roster.filter((w) => !value.includes(w.id));
};

/**
 *
 */
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
