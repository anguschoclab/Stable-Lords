import type { GameState } from '@/types/state.types';
import type { BoutResult } from '@/engine/boutProcessor';
import type { EconomySlice } from './slices/economySlice';
import type { RosterSlice } from './slices/rosterSlice';
import type { WorldSlice } from './slices/worldSlice';
import type { TournamentSlice } from './slices/tournamentSlice';
import type { BookmarksSlice } from './slices/bookmarksSlice';

export interface GameStoreState {
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  lastSimulationReport?: import('@/types/combat.types').FightOutcome;
  isSimulating: boolean;
  isInitialized: boolean;
  eventLogOpen: boolean;
}

export interface GameStoreActions {
  setSimulating: (simulating: boolean) => void;
  toggleEventLog: () => void;
  setEventLogOpen: (open: boolean) => void;
  doAdvanceWeek: (
    processedState?: GameState,
    results?: BoutResult[],
    deaths?: string[],
    injuries?: string[]
  ) => Promise<void>;
  doAdvanceDay: (
    processedState?: GameState,
    results?: BoutResult[],
    deaths?: string[],
    injuries?: string[]
  ) => Promise<void>;
  initialize: () => void;
  loadGame: (slotId: string, gameState: GameState) => void;
  doReset: () => void;
  returnToTitle: () => void;
  saveCurrentState: () => Promise<void>;
  setState: (fn: (state: GameStore) => void) => void;
}

export type GameStore = GameStoreState &
  GameStoreActions &
  EconomySlice &
  RosterSlice &
  WorldSlice &
  TournamentSlice &
  BookmarksSlice;
