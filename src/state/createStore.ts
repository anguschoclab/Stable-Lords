import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameState } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { engineProxy } from '@/engine/runtime/workerProxy';
import { archiveService } from '@/engine/storage/archiveService';
import {
  flushDeferredArchivesOffThread,
  onArchiveRetry,
} from '@/engine/pipeline/adapters/opfsArchiver';
import { engineSession, bumpEngineEpoch } from '@/engine/runtime/session';
import { telemetry, TelemetryEvents, isTelemetryEnabled } from '@/engine/core/telemetry';
import {
  stripNonSerializable,
  reconstructGameState,
  clearReconstructionCache,
} from './serialization';
import type { GameStore } from './store.types';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { StyleRollups } from '@/engine/stats/styleRollups';

import type { UseBoundStore, StoreApi } from 'zustand';

// ─── Slices ────────────────────────────────────────────────────────────────
import { createEconomySlice } from './slices/economySlice';
import { createRosterSlice } from './slices/rosterSlice';
import { createWorldSlice } from './slices/worldSlice';
import { createTournamentSlice } from './slices/tournamentSlice';
import { createBookmarksSlice } from './slices/bookmarksSlice';
import { createProgressionSlice } from './slices/progressionSlice';
import { DEFAULT_PROGRESSION } from '@/constants/progression';

/**
 * Post-process a worker-returned state and commit it to the store.
 * Shared by doAdvanceWeek/doAdvanceDay — previously duplicated inline.
 */
function commitWorkerResult(store: GameStore, next: GameState, currentWeek: number): void {
  const flushed = flushDeferredArchivesOffThread(next);
  flushed.phase = 'resolution';
  const display = flushed.lastWeekBoutDisplay;
  const resolutionPayload = {
    bouts: display?.results ?? [],
    deaths: display?.deathNames ?? [],
    injuries: display?.injuryNames ?? [],
    promotions: [],
    gazette: flushed.newsletter.filter((n) => n.week === currentWeek),
  };
  flushed.pendingResolutionData = resolutionPayload;

  if (flushed.arenaHistory && flushed.arenaHistory.length > 0) {
    const idx = flushed.arenaHistory.length - 1;
    const lastEntry = flushed.arenaHistory[idx];
    if (lastEntry) {
      flushed.arenaHistory[idx] = { ...lastEntry, pendingResolutionData: resolutionPayload };
    }
  }

  store.loadGame(store.activeSlotId || 'autosave', flushed);
  useGameStore.setState({ isSimulating: false });
}

/**
 * Writes a loaded GameState into the draft — the field-by-field
 * hydration shared by loadGame and worker-result commits.
 */
function hydrateDraft(draft: GameStore, state: GameState, slotId: string) {
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
  draft.absoluteWeek = state.absoluteWeek ?? deriveAbsoluteWeek(state.year, state.week);

  draft.popularity = state.popularity || 0;
  draft.fame = state.fame || 0;
  draft.realmRankings = state.realmRankings || {};
  draft.awards = state.awards || [];
  draft.arenaChampions = state.arenaChampions || {};
  draft.grandChampions = state.grandChampions || [];
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
  draft.houseRules = state.houseRules;
  draft.contentPacks = state.contentPacks;
  draft.lifetimeStats = state.lifetimeStats;
  draft.rivalries = state.rivalries || [];
  draft.matchHistory = state.matchHistory || [];
  draft.ownerGrudges = state.ownerGrudges || [];
  draft.phase = state.phase || 'planning';
  draft.pendingResolutionData = state.pendingResolutionData;
  draft.lastWeekBoutDisplay = state.lastWeekBoutDisplay;
  draft.playerChallenges = state.playerChallenges || [];
  draft.playerAvoids = state.playerAvoids || [];
  draft.bookmarks = state.bookmarks || [];
  draft.progression = state.progression || DEFAULT_PROGRESSION;
  draft.lastSimulationReport = state.lastSimulationReport;
  draft.deferredBoutLogs = state.deferredBoutLogs || [];

  draft.activeSlotId = slotId;
  draft.atTitleScreen = false;
  draft.lastSavedAt = new Date().toISOString();
}

/**
 * Shared engine worker runner for doAdvanceWeek/doAdvanceDay —
 * serialization, 15s timeout, epoch-guarded commit, telemetry, and
 * the isSimulating lifecycle were previously duplicated inline.
 */
async function runEngineJob(
    set: (fn: (draft: GameStore) => void) => void,
    get: () => GameStore,
    cleanState: GameState,
    currentWeek: number,
    job: () => Promise<GameState>,
    opName: string
  ) {
  const store = get();
  set((draft) => {
    draft.isSimulating = true;
  });

  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Worker timeout after 15s')), 15000);
  });

  try {
    // runExclusive serializes against every other engine caller
    // (autosim, admin skips) and returns undefined when a loadGame/reset
    // bumped the epoch while the worker computed — stale results are
    // discarded instead of clobbering newer state.
    const next = await engineSession.runExclusive(async () => {
      const t0 = performance.now();
      const resolved = await Promise.race([job(), timeout]);
      if (timerId) clearTimeout(timerId);
      telemetry.timing(TelemetryEvents.ENGINE_ROUNDTRIP_MS, performance.now() - t0, {
        op: opName,
      });
      if (isTelemetryEnabled()) {
        telemetry.gauge(
          TelemetryEvents.SERIALIZATION_PAYLOAD_BYTES,
          JSON.stringify(cleanState).length
        );
      }
      return resolved;
    });
    if (!next) {
      set((draft) => {
        draft.isSimulating = false;
      });
      return;
    }
    commitWorkerResult(store, next, currentWeek);
  } catch (err) {
    console.error('Worker advancement failed:', err);
    set((draft) => {
      draft.isSimulating = false;
    });
  }
}

type StoreSet = (fn: ((draft: GameStore) => void) | Partial<GameStore>) => void;
type StoreGet = () => GameStore;

/** Static defaults plus the trivial UI toggles that don't touch the engine. */
function createCoreState(
  set: StoreSet
): Pick<
  GameStore,
  | 'activeSlotId'
  | 'atTitleScreen'
  | 'lastSavedAt'
  | 'isSimulating'
  | 'isInitialized'
  | 'eventLogOpen'
  | 'toggleEventLog'
  | 'setEventLogOpen'
  | 'initialize'
  | 'setSimulating'
> {
  return {
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

    setSimulating: (simulating: boolean) => {
      set((draft) => {
        draft.isSimulating = simulating;
      });
    },
  };
}

/** Game lifecycle actions: load, week/day advance, save, reset, title return. */
function createCoreActions(
  set: StoreSet,
  get: StoreGet
): Pick<
  GameStore,
  | 'loadGame'
  | 'doAdvanceWeek'
  | 'doAdvanceDay'
  | 'saveCurrentState'
  | 'doReset'
  | 'returnToTitle'
  | 'setState'
> {
  return {
    loadGame: (slotId: string, state: GameState) => {
      bumpEngineEpoch();
      clearReconstructionCache();
      StyleRollups._clearCaches();
      set((draft) => hydrateDraft(draft, state, slotId));
      archiveService.archiveHotState(slotId, state);
    },

    doAdvanceWeek: async (processedState?: GameState) => {
      if (get().isSimulating) return;
      const store = get();
      const raw = processedState || reconstructGameState(store);
      const cleanState = stripNonSerializable(raw) as GameState;
      const currentWeek = cleanState.week;
      await runEngineJob(
        set,
        get,
        cleanState,
        currentWeek,
        () =>
          cleanState.isTournamentWeek
            ? engineProxy.skipToWeekEnd(cleanState)
            : engineProxy.advanceWeek(cleanState),
        cleanState.isTournamentWeek ? 'skipToWeekEnd' : 'advanceWeek'
      );
    },

    doAdvanceDay: async (processedState?: GameState) => {
      if (get().isSimulating) return;
      const store = get();
      const raw = processedState || reconstructGameState(store);
      const cleanState = stripNonSerializable(raw) as GameState;
      const currentWeek = cleanState.week;
      await runEngineJob(
        set,
        get,
        cleanState,
        currentWeek,
        () => engineProxy.advanceDay(cleanState),
        'advanceDay'
      );
    },

    saveCurrentState: async () => {
      const { activeSlotId } = get();
      if (activeSlotId) {
        const state = reconstructGameState(get());
        await archiveService.archiveHotState(activeSlotId, state);
        set({ lastSavedAt: new Date().toISOString() });
      }
    },

    doReset: () => {
      clearReconstructionCache();
      StyleRollups._clearCaches();
      const fresh = createFreshState('alpha-prime-10');
      get().loadGame('autosave', fresh);
      set({ atTitleScreen: true });
    },

    returnToTitle: async () => {
      await get().saveCurrentState();
      set((draft) => {
        draft.atTitleScreen = true;
        draft.activeSlotId = null;
      });
    },

    setState: (fn: (state: GameStore) => void) => {
      clearReconstructionCache();
      set(fn);
    },
  };
}

export const useGameStore: UseBoundStore<StoreApi<GameStore>> = create<GameStore>()(
  subscribeWithSelector(
    immer((set, get, ...args) => {
      return {
        // ─── Sub-Slices ───
        ...createEconomySlice(set, get, ...args),
        ...createRosterSlice(set, get, ...args),
        ...createWorldSlice(set, get, ...args),
        ...createTournamentSlice(set, get, ...args),
        ...createBookmarksSlice(set, get, ...args),
        ...createProgressionSlice(set, get, ...args),

        // ─── Core State ───
        ...createCoreState(set),
        ...createCoreActions(set, get),
      };
    })
  )
);

// Failed archive writes are re-queued onto the store's deferredBoutLogs so the
// next week's flush retries them — durability lives in the retry registry +
// store field, not in the ephemeral worker-state copy.
onArchiveRetry((log) => {
  useGameStore.setState((s) => ({
    deferredBoutLogs: [...(s.deferredBoutLogs ?? []), log],
  }));
});
