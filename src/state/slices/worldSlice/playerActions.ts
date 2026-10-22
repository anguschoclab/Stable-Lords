import type { GameStore } from '@/state/useGameStore';
import type { GameState } from '@/types/state.types';
import { STARTING_TREASURY } from '@/constants/economy';
import { createChampionshipDelta, relinquishCrown } from '@/engine/championship/arenaChampionship';
import { sanitizeEntityName } from '@/utils/entityName';
import type { ArenaPreferences } from './types';

/**
 *
 */
export function createPlayerActions(set: (fn: (state: GameStore) => Partial<GameStore>) => void) {
  return {
    setWeek: (week: number) => set(() => ({ week })),

    setArenaPreferences: (prefs: Partial<ArenaPreferences>) => {
      set((state) => ({
        arenaPreferences: { ...state.arenaPreferences, ...prefs },
      }));
    },

    initializeStable: (name: string, stableName: string) => {
      set((state) => ({
        player: {
          ...state.player,
          name: sanitizeEntityName(name) || state.player?.name || 'Unknown',
          stableName: sanitizeEntityName(stableName) || state.player?.stableName || 'Unknown',
        },
        treasury: STARTING_TREASURY,
      }));
    },

    renameStable: (newName: string) => {
      set((state) => {
        const clean = sanitizeEntityName(newName);
        if (!clean) return state;
        return { player: { ...state.player, stableName: clean } };
      });
    },

    renamePlayer: (newName: string) => {
      set((state) => {
        const clean = sanitizeEntityName(newName);
        if (!clean) return state;
        return { player: { ...state.player, name: clean } };
      });
    },

    toggleChallenge: (warriorId: string) => {
      set((state) => {
        const challenges = state.playerChallenges || [];
        const avoids = state.playerAvoids || [];
        if (challenges.includes(warriorId)) {
          return { playerChallenges: challenges.filter((id) => id !== warriorId) };
        }
        return {
          playerChallenges: [...challenges, warriorId],
          playerAvoids: avoids.filter((id) => id !== warriorId),
        };
      });
    },

    relinquishArenaTitle: (arenaId: string) => {
      set((state) => {
        const delta = createChampionshipDelta();
        relinquishCrown(state as unknown as GameState, delta, arenaId);
        const nextTitle = delta.arenaChampions[arenaId];
        if (!nextTitle) return {};
        return {
          arenaChampions: { ...state.arenaChampions, [arenaId]: nextTitle },
          newsletter: [...(state.newsletter ?? []), ...delta.newsletterItems],
        };
      });
    },

    toggleAvoid: (warriorId: string) => {
      set((state) => {
        const challenges = state.playerChallenges || [];
        const avoids = state.playerAvoids || [];
        if (avoids.includes(warriorId)) {
          return { playerAvoids: avoids.filter((id) => id !== warriorId) };
        }
        return {
          playerAvoids: [...avoids, warriorId],
          playerChallenges: challenges.filter((id) => id !== warriorId),
        };
      });
    },
  };
}
