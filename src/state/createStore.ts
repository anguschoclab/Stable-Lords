import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { type BoutResult } from '@/engine/bout';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { engineProxy } from '@/engine/workerProxy';
import { opfsArchive } from '@/engine/storage/opfsArchive';
import { flushDeferredArchivesOffThread } from '@/engine/pipeline/adapters/opfsArchiver';
import { stripNonSerializable, reconstructGameState } from './serialization';
import type { GameStore } from './store.types';

// ─── Slices ────────────────────────────────────────────────────────────────
import { createEconomySlice } from './slices/economySlice';
import { createRosterSlice } from './slices/rosterSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createTournamentSlice } from './slices/tournamentSlice';
import { createBookmarksSlice } from './slices/bookmarksSlice';

export const useGameStore = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get, ...args) => ({
      // ─── Sub-Slices ───
      ...createEconomySlice(set, get, ...args),
      ...createRosterSlice(set, get, ...args),
      ...createWorldSlice(set, get, ...args),
      ...createTournamentSlice(set, get, ...args),
      ...createBookmarksSlice(set, get, ...args),

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
          draft.unacknowledgedDeaths = (state.unacknowledgedDeaths || []) as WarriorId[];
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
          draft.bookmarks = state.bookmarks || [];
          draft.lastSimulationReport = state.lastSimulationReport as never;

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
        const cleanState = stripNonSerializable(raw) as GameState;
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

          next = flushDeferredArchivesOffThread(next);
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
        const cleanState = stripNonSerializable(raw) as GameState;
        const currentWeek = cleanState.week;

        set((draft) => {
          draft.isSimulating = true;
        });

        try {
          let next = await engineProxy.advanceDay(cleanState);

          next = flushDeferredArchivesOffThread(next);
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
