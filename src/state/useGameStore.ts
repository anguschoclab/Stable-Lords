import { create } from "zustand";
import * as Comlink from "comlink";
import { immer } from "zustand/middleware/immer";
import type { GameState, FightSummary, Warrior } from "@/types/game";
import { type BoutResult } from "@/engine/boutProcessor";
import {
  createFreshState,
  advanceWeek,
  appendFightToHistory,
  updateWarriorAfterFight,
  initializeStable,
  draftInitialRoster,
  updateWarriorEquipment,
} from "./gameStore";
import { consumeInsightToken } from "./mutations/tokenMutations";
import { engineProxy } from "@/engine/workerProxy";
import {
  migrateLegacySave,
  getActiveSlot,
  loadFromSlot,
  saveToSlot,
  listSaveSlots,
} from "./saveSlots";
import { hashStr } from "@/utils/idUtils";
import { SeededRNG } from "@/utils/random";

export interface GameStoreState {
  state: GameState;
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
  isSimulating: boolean;
  isInitialized: boolean;
}

export interface GameStoreActions {
  setState: (next: GameState | ((prev: GameState) => GameState)) => void;
  setSimulating: (simulating: boolean) => void;
  doAdvanceWeek: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => Promise<void>;
  doAdvanceDay: (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => Promise<void>;
  doAppendFight: (summary: FightSummary) => void;
  doUpdateWarrior: (
    warriorId: string,
    won: boolean,
    killed: boolean,
    fameDelta: number,
    popDelta: number
  ) => void;
  doReset: () => void;
  returnToTitle: () => void;
  initialize: () => void;
  loadGame: (slotId: string, gameState: GameState) => void;
  doInitializeStable: (name: string, stableName: string) => void;
  doDraftInitialRoster: (warriors: Warrior[]) => void;
  doUpdateEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => void;
  doConsumeInsightToken: (tokenId: string, warriorId: string) => void;
}

const initialData = { state: createFreshState(), activeSlotId: null as string | null };

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  immer((set, get) => ({
    state: initialData.state,
    activeSlotId: initialData.activeSlotId,
    atTitleScreen: true,
    lastSavedAt: null,
    isSimulating: false,
    isInitialized: false,

    initialize: () => {
      migrateLegacySave();
      const slotId = getActiveSlot();
      if (slotId) {
        loadFromSlot(slotId).then((loaded) => {
          set((draft) => {
            if (loaded) {
              draft.state = loaded;
              draft.activeSlotId = slotId;
              draft.atTitleScreen = !listSaveSlots().some((s) => s.slotId === slotId);
            }
            draft.isInitialized = true;
          });
        });
      } else {
        set((draft) => {
          draft.isInitialized = true;
        });
      }
    },

    loadGame: (slotId: string, state: GameState) => {
      set((draft) => {
        draft.state = state;
        draft.activeSlotId = slotId;
        draft.atTitleScreen = false;
        draft.lastSavedAt = new Date().toISOString();
        saveToSlot(slotId, state);
      });
    },

    setSimulating: (simulating: boolean) => {
      set((draft) => {
        draft.isSimulating = simulating;
      });
    },

    setState: (next: GameState | ((prev: GameState) => GameState)) => {
      set((draft) => {
        const nextState = typeof next === "function" ? next(draft.state) : next;
        draft.state = nextState;
        draft.lastSavedAt = new Date().toISOString();
        
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, nextState);
        }
      });
    },

    doAdvanceWeek: async (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
      const { state, activeSlotId } = get();
      let next = processedState || state;
      const currentWeek = next.week;

      set((draft) => { draft.isSimulating = true; });

      try {
        if (next.isTournamentWeek) {
          for (let i = next.day; i < 7; i++) {
            next = await engineProxy.advanceDay(next);
          }
        } else {
          next = await engineProxy.advanceWeek(next);
        }
        
        // Populate resolution data for the summary view
        next.phase = "resolution";
        next.pendingResolutionData = {
          bouts: results || [],
          deaths: deaths || [],
          injuries: injuries || [],
          promotions: [],
          gazette: next.newsletter.filter(n => n.week === currentWeek),
        };

        set((draft) => {
          draft.state = next;
          draft.isSimulating = false;
          if (draft.activeSlotId) {
            saveToSlot(draft.activeSlotId, next);
            draft.lastSavedAt = new Date().toISOString();
          }
        });
      } catch (err) {
        console.error("Worker advancement failed:", err);
        set((draft) => { draft.isSimulating = false; });
      }
    },

    doAdvanceDay: async (processedState?: GameState, results?: BoutResult[], deaths?: string[], injuries?: string[]) => {
      const { state, activeSlotId } = get();
      const baseState = processedState || state;
      const currentWeek = baseState.week;
      
      set((draft) => { draft.isSimulating = true; });

      try {
        const next = await engineProxy.advanceDay(baseState);
        
        // Populate resolution data for the summary view
        next.phase = "resolution";
        next.pendingResolutionData = {
          bouts: results || [],
          deaths: deaths || [],
          injuries: injuries || [],
          promotions: [],
          gazette: next.newsletter.filter(n => n.week === currentWeek),
        };

        set((draft) => {
          draft.state = next;
          draft.isSimulating = false;
          if (draft.activeSlotId) {
            saveToSlot(draft.activeSlotId, next);
            draft.lastSavedAt = new Date().toISOString();
          }
        });
      } catch (err) {
        console.error("Worker advancement failed:", err);
        set((draft) => { draft.isSimulating = false; });
      }
    },

    doAppendFight: (summary: FightSummary) => {
      set((draft) => {
        const next = appendFightToHistory(draft.state, summary);
        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doUpdateWarrior: (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      set((draft) => {
        const next = updateWarriorAfterFight(draft.state, warriorId, won, killed, fameDelta, popDelta);
        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doReset: () => {
      localStorage.removeItem("stablelords.activeSlot");
      set((draft) => {
        draft.activeSlotId = null;
        draft.state = createFreshState();
        draft.atTitleScreen = true;
      });
    },

    returnToTitle: () => {
      const { activeSlotId, state } = get();
      if (activeSlotId) {
        saveToSlot(activeSlotId, state);
      }
      localStorage.removeItem("stablelords.activeSlot");
      set((draft) => {
        draft.activeSlotId = null;
        draft.state = createFreshState();
        draft.atTitleScreen = true;
      });
    },

    doInitializeStable: (name: string, stableName: string) => {
      set((draft) => {
        const next = initializeStable(draft.state, name, stableName);
        draft.state = next;
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
      });
    },

    doDraftInitialRoster: (warriors: Warrior[]) => {
      set((draft) => {
        const next = draftInitialRoster(draft.state, warriors);
        draft.state = next;
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
      });
    },

    doUpdateEquipment: (warriorId: string, equipment: { weapon: string; armor: string; shield: string; helm: string }) => {
      set((draft) => {
        const next = updateWarriorEquipment(draft.state, warriorId, equipment);
        draft.state = next;
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
      });
    },

    doConsumeInsightToken: async (tokenId: string, warriorId: string) => {
      const { state, activeSlotId } = get();
      
      // Determinism: Seed RNG with week + warriorId for reproducible results
      const seedValue = state.week * 7 + hashStr(warriorId || tokenId);
      const rng = new SeededRNG(seedValue);
      
      const next = await engineProxy.assignToken(state, tokenId, warriorId, Comlink.proxy(() => rng.next()));
      
      set((draft) => {
        draft.state = next;
        if (draft.activeSlotId) {
          saveToSlot(draft.activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },
  }))
);

export const useGame = useGameStore;
