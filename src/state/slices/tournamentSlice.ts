import { StateCreator } from "zustand";
import { TournamentEntry } from "@/types/state.types";

export interface TournamentSlice {
  tournaments: TournamentEntry[];
  isTournamentWeek: boolean;
  activeTournamentId?: string;
  setTournaments: (tournaments: TournamentEntry[]) => void;
  setTournamentWeek: (isTournamentWeek: boolean) => void;
  setActiveTournament: (id?: string) => void;
}

export const createTournamentSlice: StateCreator<any, [], [], TournamentSlice> = (set) => ({
  tournaments: [],
  isTournamentWeek: false,
  activeTournamentId: undefined,

  setTournaments: (tournaments) => set({ tournaments }),
  setTournamentWeek: (isTournamentWeek) => set({ isTournamentWeek }),
  setActiveTournament: (activeTournamentId) => set({ activeTournamentId }),
});
