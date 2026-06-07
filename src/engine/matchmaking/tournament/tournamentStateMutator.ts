import type { GameState, TournamentEntry } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { WarriorId, StableId } from '@/types/shared.types';
import { StateImpact } from '@/engine/impacts';
import { updateEntityInList } from '@/utils/stateUtils';

/**
 * Helper functions to modify/find warriors in state for tournament operations.
 */
export function modifyWarrior(
  state: GameState,
  warriorId: WarriorId,
  transform: (w: Warrior) => void
): StateImpact {
  const rosterUpdates = new Map<WarriorId, Partial<Warrior>>();
  const rivalsUpdates = new Map<StableId, Partial<import('@/types/game').RivalStableData>>();

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
      rivalsUpdates.set(r.id as StableId, { roster: updatedRoster });
    }
  });

  return {
    rosterUpdates,
    rivalsUpdates,
  };
}

const warriorCache = new WeakMap<GameState, Map<WarriorId, Warrior>>();

export function findWarriorById(
  state: GameState,
  warriorId: WarriorId,
  tournament?: TournamentEntry
): Warrior | undefined {
  // Check tournament first if provided
  if (tournament) {
    for (const participant of tournament.participants) {
      if (participant.id === warriorId && participant.attributes) {
        return participant;
      }
    }
  }

  let map = warriorCache.get(state);
  if (!map) {
    map = new Map<WarriorId, Warrior>();
    for (const w of state.roster) {
      map.set(w.id, w);
    }
    for (const r of state.rivals) {
      for (const w of r.roster) {
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
