import { StateCreator } from 'zustand';
import type { TournamentCycle, TournamentEntry } from '@/types/state.types';
import type { StableId, TournamentId, WarriorId } from '@/types/shared.types';
import type { GameStore } from '@/state/useGameStore';
import { classAtFreeze } from '@/engine/matchmaking/tournamentSelection/classes';
import { fileGrudgeCallout, fileStablemateHunt } from '@/engine/matchmaking/grudgeMatches';
import { fightEquivalentsOf } from '@/engine/warrior/careerUpdate';

/** V27: max declarations a stable may file per class per cycle. */
const MAX_DECLARED_PER_CLASS = 4;

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
  /** V27: player-initiated grudge call-out on a completed class bracket. */
  callOutGrudgeMatch: (
    tournamentId: TournamentId,
    loserId: WarriorId,
    killerId: WarriorId
  ) => void;
  /** V27: player-initiated stablemate hunt — an unbooked bracket finisher
   *  avenges a felled stablemate when the victim itself is already booked. */
  sendStablemateHunt: (
    tournamentId: TournamentId,
    avengerId: WarriorId,
    killerId: WarriorId
  ) => void;
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
  declareTournamentEntry: (warriorId) =>
    set((s) => {
      const cycle = s.tournamentCycle;
      if (!cycle || !s.roster.some((w) => w.id === warriorId)) return {};
      if (cycle.scratched.includes(warriorId)) return {};
      const cls = (id: WarriorId) => {
        const w = s.roster.find((r) => r.id === id);
        return classAtFreeze(s, id, w ? fightEquivalentsOf(w) : 0);
      };
      const classId = cls(warriorId);
      const mine = cycle.declared[s.player.id] ?? [];
      const inClass = mine.filter((id) => cls(id) === classId);
      if (mine.includes(warriorId) || inClass.length >= MAX_DECLARED_PER_CLASS) return {};
      return {
        tournamentCycle: {
          ...cycle,
          declared: { ...cycle.declared, [s.player.id]: [...mine, warriorId] },
        },
      };
    }),
  scratchTournamentEntry: (warriorId) =>
    set((s) => {
      const cycle = s.tournamentCycle;
      if (!cycle || cycle.scratched.includes(warriorId)) return {};
      const declared = { ...cycle.declared };
      for (const key of Object.keys(declared) as StableId[]) {
        declared[key] = (declared[key] ?? []).filter((id) => id !== warriorId);
      }
      return {
        tournamentCycle: { ...cycle, declared, scratched: [...cycle.scratched, warriorId] },
      };
    }),
  callOutGrudgeMatch: (tournamentId, loserId, killerId) =>
    set((s) => {
      const offer = fileGrudgeCallout(s, tournamentId, loserId, killerId);
      if (!offer) return {};
      return { boutOffers: { ...(s.boutOffers ?? {}), [offer.id]: offer } };
    }),
  sendStablemateHunt: (tournamentId, avengerId, killerId) =>
    set((s) => {
      const offer = fileStablemateHunt(s, tournamentId, avengerId, killerId);
      if (!offer) return {};
      return { boutOffers: { ...(s.boutOffers ?? {}), [offer.id]: offer } };
    }),
});
