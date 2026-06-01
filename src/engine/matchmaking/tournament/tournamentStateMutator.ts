import type { GameState, TournamentEntry } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { StateImpact } from '@/engine/impacts';
import { updateEntityInList } from '@/utils/stateUtils';

/**
 * Helper functions to modify/find warriors in state for tournament operations.
 */
export function modifyWarrior(
  state: GameState,
  warriorId: string,
  transform: (w: Warrior) => void
): StateImpact {
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, any>();

  state.roster.forEach((w) => {
    if (w.id === warriorId) {
      const newW = { ...w };
      transform(newW);
      rosterUpdates.set(warriorId, newW);
    }
  });

  state.rivals.forEach((r) => {
    let modified = false;
    const updatedRoster = updateEntityInList(r.roster, warriorId, (w) => {
      modified = true;
      const newW = { ...w };
      transform(newW);
      return newW;
    });
    if (modified) {
      rivalsUpdates.set(r.id, { roster: updatedRoster });
    }
  });

  return {
    rosterUpdates,
    rivalsUpdates,
  };
}

const warriorCache = new WeakMap<GameState, Map<string, Warrior>>();

export function findWarriorById(
  state: GameState,
  warriorId: string,
  tournament?: TournamentEntry
): Warrior | undefined {
  // Check tournament first if provided
  if (tournament) {
    for (let i = 0; i < tournament.participants.length; i++) {
      const participant = tournament.participants[i];
      if (participant.id === warriorId && participant.attributes) {
        return participant;
      }
    }
  }

  let map = warriorCache.get(state);
  if (!map) {
    map = new Map<string, Warrior>();
    for (let i = 0; i < state.roster.length; i++) {
      const w = state.roster[i];
      map.set(w.id, w);
    }
    for (let i = 0; i < state.rivals.length; i++) {
      const r = state.rivals[i];
      for (let j = 0; j < r.roster.length; j++) {
        const w = r.roster[j];
        map.set(w.id, w);
      }
    }
    warriorCache.set(state, map);
  }

  return map.get(warriorId);
}

export function clearWarriorCache(): void {
  // No-op because we use a WeakMap now
}
