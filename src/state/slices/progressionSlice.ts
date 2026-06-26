import { StateCreator } from 'zustand';
import type { ProgressionState } from '@/types/state.types';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import type { GameStore } from '@/state/useGameStore';

export interface ProgressionSlice {
  progression: ProgressionState;
  acknowledgeWin: () => void;
}

export const createProgressionSlice: StateCreator<GameStore, [], [], ProgressionSlice> = (set) => ({
  progression: DEFAULT_PROGRESSION,
  acknowledgeWin: () =>
    set((state) => ({
      progression: {
        ...state.progression,
        status: 'continued' as const,
        acknowledgedWin: true,
      },
    })),
});
