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
  };
}
