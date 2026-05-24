import type { GameState } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import { StateImpact } from '@/engine/impacts';
import { findWarriorById, clearWarriorCache } from '@/engine/core/warriorLookup';

// Re-export for backward compatibility
export { findWarriorById, clearWarriorCache };

/**
 * Helper functions to modify/find warriors in state for tournament operations.
 */
export function modifyWarrior(
  state: GameState,
  warriorId: string,
  transform: (w: Warrior) => void
): StateImpact {
  const rosterUpdates = new Map<string, Partial<Warrior>>();
  const rivalsUpdates = new Map<string, any>(); // eslint-disable-line @typescript-eslint/no-explicit-any

  state.roster.forEach((w) => {
    if (w.id === warriorId) {
      const newW = { ...w };
      transform(newW);
      rosterUpdates.set(warriorId, newW);
    }
  });

  state.rivals.forEach((r) => {
    let modified = false;
    const updatedRoster = r.roster.map((w) => {
      if (w.id === warriorId) {
        modified = true;
        const newW = { ...w };
        transform(newW);
        return newW;
      }
      return w;
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
