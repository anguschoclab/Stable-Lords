import { StateCreator } from 'zustand';
import type { TournamentCycle, TournamentEntry } from '@/types/state.types';
import type { TournamentId, WarriorId } from '@/types/shared.types';
import type { GameStore } from '@/state/useGameStore';

/**
 * Defines the shape of tournament slice.
 */
export interface TournamentSlice {
  tournaments: TournamentEntry[];
  isTournamentWeek: boolean;
  activeTournamentId?: TournamentId;
  /** V27: frozen FE snapshot + entry ledger for the upcoming seasonal. */
  tournamentCycle?: TournamentCycle;
  setTournaments: (tournaments: TournamentEntry[]) => void;
  setTournamentWeek: (isTournamentWeek: boolean) => void;
  setActiveTournament: (id?: TournamentId) => void;
  /** V27: declare a player warrior into their frozen class bracket. */
  declareTournamentEntry: (warriorId: WarriorId) => void;
  /** V27: scratch a warrior from the cycle (invite declined or entry pulled). */
  scratchTournamentEntry: (warriorId: WarriorId) => void;
}

/**
 * Create tournament slice.
 */
export const createTournamentSlice: StateCreator<GameStore, [], [], TournamentSlice> = (set) => ({
  tournaments: [],
  isTournamentWeek: false,
  activeTournamentId: undefined,
  tournamentCycle: undefined,

  setTournaments: (tournaments) => set({ tournaments }),
  setTournamentWeek: (isTournamentWeek) => set({ isTournamentWeek }),
  setActiveTournament: (activeTournamentId) => set({ activeTournamentId }),
  // Phase-1 stubs — real cap/class-checked mutations land in Phase 6.
  declareTournamentEntry: (_warriorId) => {},
  scratchTournamentEntry: (_warriorId) => {},
});
