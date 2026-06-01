import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from '@/types/state.types';
import { type BoutResult } from '@/engine/boutProcessor';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { engineProxy } from '@/engine/workerProxy';
import { opfsArchive } from '@/engine/storage/opfsArchive';
import { stripNonSerializable, reconstructGameState } from './serialization';
export { reconstructGameState };

// ─── Slices ────────────────────────────────────────────────────────────────
import { createEconomySlice, EconomySlice } from './slices/economySlice';
import { createRosterSlice, RosterSlice } from './slices/rosterSlice';
import { createWorldSlice, WorldSlice } from './slices/worldSlice';
import { createTournamentSlice, TournamentSlice } from './slices/tournamentSlice';/**
                                                                                   * Defines the shape of game store state.
                                                                                   */


/**
 * Defines the shape of game store state.
 */
export interface GameStoreState {
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  lastSimulationReport?: import('@/types/combat.types').FightOutcome;
  isSimulating: boolean;
  isInitialized: boolean;
  eventLogOpen: boolean;
}/**
  * Defines the shape of game store actions.
  */


/**
 * Defines the shape of game store actions.
 */
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
}/**
  * Game store type.
  */


/**
 * Game store type.
 */
export type GameStore = GameStoreState &
  GameStoreActions &
  EconomySlice &
  RosterSlice &
  WorldSlice &
  TournamentSlice;/**
                   * Use game store.
                   */


/**
 * Use game store.
 */
export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get, ...args) => ({
      // ─── Sub-Slices ───
      ...createEconomySlice(set, get, ...args),
      ...createRosterSlice(set, get, ...args),
      ...createWorldSlice(set, get, ...args),
      ...createTournamentSlice(set, get, ...args),

      // ─── Core State ───
      activeSlotId: null,
      atTitleScreen: true,
      lastSavedAt: null,
      isSimulating: false,
      isInitialized: false,
      eventLogOpen: false,

      toggleEventLog: () => {
        set((draft) => {
          draft.eventLogOpen = !draft.eventLogOpen;
        });
      },
      setEventLogOpen: (open: boolean) => {
        set((draft) => {
          draft.eventLogOpen = open;
        });
      },

      initialize: () => {
        set((draft) => {
          draft.isInitialized = true;
        });
      },

      loadGame: (slotId: string, state: GameState) => {
        set((draft) => {
          draft.treasury = state.treasury;
          draft.ledger = state.ledger;
          draft.roster = state.roster;
          draft.graveyard = state.graveyard;
          draft.retired = state.retired;
          draft.recruitPool = state.recruitPool;
          draft.insightTokens = state.insightTokens;
          draft.arenaHistory = state.arenaHistory;
          draft.player = state.player;
          draft.week = state.week;
          draft.day = state.day;
          draft.season = state.season;
          draft.weather = state.weather;
          draft.promoters = state.promoters || {};
          draft.boutOffers = state.boutOffers || {};
          draft.rivals = state.rivals;
          draft.gazettes = state.gazettes;
          draft.scoutReports = state.scoutReports || [];
          draft.unacknowledgedDeaths = state.unacknowledgedDeaths || [];
          draft.rosterBonus = state.rosterBonus || 0;
          draft.tournaments = state.tournaments || [];
          draft.isTournamentWeek = state.isTournamentWeek || false;
          draft.activeTournamentId = state.activeTournamentId;
          draft.year = state.year || 1;

          draft.popularity = state.popularity || 0;
          draft.fame = state.fame || 0;
          draft.realmRankings = state.realmRankings || {};
          draft.awards = state.awards || [];
          draft.trainers = state.trainers || [];
          draft.hiringPool = state.hiringPool || [];
          draft.trainingAssignments = state.trainingAssignments || [];
          draft.seasonalGrowth = state.seasonalGrowth || [];
          draft.restStates = state.restStates || [];
          draft.crowdMood = state.crowdMood || 'Neutral';
          draft.moodHistory = state.moodHistory || [];
          draft.newsletter = state.newsletter || [];
          draft.hallOfFame = state.hallOfFame || [];
          draft.isFTUE = state.isFTUE || false;
          draft.ftueStep = state.ftueStep || 0;
          draft.ftueComplete = state.ftueComplete || false;
          draft.coachDismissed = state.coachDismissed || [];
          draft.rivalries = state.rivalries || [];
          draft.matchHistory = state.matchHistory || [];
          draft.ownerGrudges = state.ownerGrudges || [];
          draft.phase = state.phase || 'planning';
          draft.pendingResolutionData = state.pendingResolutionData;
          draft.playerChallenges = state.playerChallenges || [];
          draft.playerAvoids = state.playerAvoids || [];
          draft.lastSimulationReport = state.lastSimulationReport;

          draft.activeSlotId = slotId;
          draft.atTitleScreen = false;
          draft.lastSavedAt = new Date().toISOString();
        });
        opfsArchive.archiveHotState(slotId, state);
      },

      setSimulating: (simulating: boolean) => {
        set((draft) => {
          draft.isSimulating = simulating;
        });
      },

      doAdvanceWeek: async (
        processedState?: GameState,
        results?: BoutResult[],
        deaths?: string[],
        injuries?: string[]
      ) => {
        const store = get();
        const raw = processedState || reconstructGameState(store);
        // In DEV mode (main thread), deep-clone to unfreeze immer's frozen objects
        // In PROD (worker), structured clone handles this automatically
        const state = import.meta.env.DEV ? JSON.parse(JSON.stringify(raw)) : raw;
        // Strip non-serializable fields before structured-clone transfer to worker
        const cleanState = stripNonSerializable(state) as GameState;
        const currentWeek = cleanState.week;

        set((draft) => {
          draft.isSimulating = true;
        });

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Worker timeout after 15s')), 15000)
        );

        try {
          let next: GameState;
          if (cleanState.isTournamentWeek) {
            next = await Promise.race([engineProxy.skipToWeekEnd(cleanState), timeout]);
          } else {
            next = await Promise.race([engineProxy.advanceWeek(cleanState), timeout]);
          }

          next.phase = 'resolution';
          const resolutionPayload = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter((n) => n.week === currentWeek),
          };
          next.pendingResolutionData = resolutionPayload;

          if (next.arenaHistory && next.arenaHistory.length > 0) {
            const idx = next.arenaHistory.length - 1;
            const lastEntry = next.arenaHistory[idx];
            if (lastEntry) {
              next.arenaHistory[idx] = { ...lastEntry, pendingResolutionData: resolutionPayload };
            }
          }

          store.loadGame(store.activeSlotId || 'autosave', next);
          set((draft) => {
            draft.isSimulating = false;
          });
        } catch (err) {
          console.error('Worker advancement failed:', err);
          set((draft) => {
            draft.isSimulating = false;
          });
        }
      },

      doAdvanceDay: async (
        processedState?: GameState,
        results?: BoutResult[],
        deaths?: string[],
        injuries?: string[]
      ) => {
        const store = get();
        const raw = processedState || reconstructGameState(store);
        const state = import.meta.env.DEV ? JSON.parse(JSON.stringify(raw)) : raw;
        const cleanState = stripNonSerializable(state) as GameState;
        const currentWeek = cleanState.week;

        set((draft) => {
          draft.isSimulating = true;
        });

        try {
          const next = await engineProxy.advanceDay(cleanState);

          next.phase = 'resolution';
          const resolutionPayload = {
            bouts: results || [],
            deaths: deaths || [],
            injuries: injuries || [],
            promotions: [],
            gazette: next.newsletter.filter((n) => n.week === currentWeek),
          };
          next.pendingResolutionData = resolutionPayload;

          if (next.arenaHistory && next.arenaHistory.length > 0) {
            const idx = next.arenaHistory.length - 1;
            const lastEntry = next.arenaHistory[idx];
            if (lastEntry) {
              next.arenaHistory[idx] = { ...lastEntry, pendingResolutionData: resolutionPayload };
            }
          }

          store.loadGame(store.activeSlotId || 'autosave', next);
          set((draft) => {
            draft.isSimulating = false;
          });
        } catch (err) {
          console.error('Worker advancement failed:', err);
          set((draft) => {
            draft.isSimulating = false;
          });
        }
      },

      saveCurrentState: async () => {
        const { activeSlotId } = get();
        if (activeSlotId) {
          const state = reconstructGameState(get());
          await opfsArchive.archiveHotState(activeSlotId, state);
          set({ lastSavedAt: new Date().toISOString() });
        }
      },

      doReset: () => {
        // Deterministic reset: If no seed provided, use a stable one for 1.0 stability
        const fresh = createFreshState('alpha-prime-10');
        get().loadGame('autosave', fresh);
        set({ atTitleScreen: true });
      },

      returnToTitle: () => {
        get().saveCurrentState();
        set((draft) => {
          draft.atTitleScreen = true;
          draft.activeSlotId = null;
        });
      },

      setState: (fn: (state: GameStore) => void) => {
        set(fn);
      },
    }))
  )
);

/** --- Fine-Grained Selectors (v4.1: Source from Slice only) --- */
export const useWorldState = () => useGameStore(reconstructGameState, shallow);/**
                                                                                * React hook: use player.
                                                                                * @returns The result.
                                                                                */

/**
 * React hook: use player.
 * @returns The result.
 */
export const usePlayer = () => useGameStore((s) => s.player);/**
                                                              * React hook: use roster.
                                                              * @returns The result.
                                                              */

/**
 * React hook: use roster.
 * @returns The result.
 */
export const useRoster = () => useGameStore((s) => s.roster);/**
                                                              * React hook: use rivals.
                                                              * @returns The result.
                                                              */

/**
 * React hook: use rivals.
 * @returns The result.
 */
export const useRivals = () => useGameStore((s) => s.rivals);/**
                                                              * React hook: use treasury.
                                                              * @returns The result.
                                                              */

/**
 * React hook: use treasury.
 * @returns The result.
 */
export const useTreasury = () => useGameStore((s) => s.treasury);/**
                                                                  * React hook: use week.
                                                                  * @returns The result.
                                                                  */

/**
 * React hook: use week.
 * @returns The result.
 */
export const useWeek = () => useGameStore((s) => s.week);/**
                                                          * React hook: use is simulating.
                                                          * @returns The result.
                                                          */

/**
 * React hook: use is simulating.
 * @returns The result.
 */
export const useIsSimulating = () => useGameStore((s) => s.isSimulating);

/** --- Computed Selectors (Derived State) --- */
interface StyleStatsRow {
  style: string;
  wins: number;
  losses: number;
  winRate: number;
}/**
  * React hook: use style stats.
  * @returns The result.
  */


/**
 * React hook: use style stats.
 * @returns The result.
 */
export const useStyleStats = (): StyleStatsRow[] =>
  useGameStore((s) => {
    const map = new Map<string, { wins: number; losses: number }>();
    for (const w of s.roster) {
      const entry = map.get(w.style) ?? { wins: 0, losses: 0 };
      entry.wins += w.career?.wins ?? 0;
      entry.losses += w.career?.losses ?? 0;
      map.set(w.style, entry);
    }
    return Array.from(map.entries())
      .map(([style, { wins, losses }]) => ({
        style,
        wins,
        losses,
        winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  });
