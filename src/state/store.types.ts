import type { GameState } from '@/types/state.types';
import type { EconomySlice } from './slices/economySlice';
import type { RosterSlice } from './slices/rosterSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { TournamentSlice } from './slices/tournamentSlice';
import type { BookmarksSlice } from './slices/bookmarksSlice';
import type { ProgressionSlice } from './slices/progressionSlice';

/**
 *
 */
export interface GameStoreState {
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  lastSimulationReport?: import('@/types/combat.types').FightOutcome;
  lastWeekBoutDisplay?: GameState['lastWeekBoutDisplay'];
  isSimulating: boolean;
  isInitialized: boolean;
  eventLogOpen: boolean;
}

/**
 *
 */
export interface GameStoreActions {
  setSimulating: (simulating: boolean) => void;
  toggleEventLog: () => void;
  setEventLogOpen: (open: boolean) => void;
  doAdvanceWeek: (
    processedState?: GameState,
  ) => Promise<void>;
  doAdvanceDay: (
    processedState?: GameState,
  ) => Promise<void>;
  initialize: () => void;
  loadGame: (slotId: string, gameState: GameState) => void;
  doReset: () => void;
  returnToTitle: () => Promise<void>;
  saveCurrentState: () => Promise<void>;
  setState: (fn: (state: GameStore) => void) => void;
}

/**
 *
 */
export type GameStore = GameStoreState &
  GameStoreActions &
  EconomySlice &
  RosterSlice &
  WorldSlice &
  TournamentSlice &
  BookmarksSlice &
  ProgressionSlice;
