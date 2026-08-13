import type { GameStore } from '@/state/useGameStore';
import { STARTING_TREASURY } from '@/constants/economy';
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
          name,
          stableName,
        },
        treasury: STARTING_TREASURY,
      }));
    },

    renameStable: (newName: string) => {
      set((state) => ({
        player: { ...state.player, stableName: newName },
      }));
    },

    renamePlayer: (newName: string) => {
      set((state) => ({
        player: { ...state.player, name: newName },
      }));
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
