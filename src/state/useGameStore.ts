import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { GameState, FightSummary, Warrior } from "@/types/game";
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
import { advanceDay } from "@/engine/dayPipeline";
import {
  migrateLegacySave,
  getActiveSlot,
  loadFromSlot,
  saveToSlot,
  listSaveSlots,
} from "./saveSlots";

export interface GameStoreState {
  state: GameState;
  atTitleScreen: boolean;
  lastSavedAt: string | null;
  activeSlotId: string | null;
}

export interface GameStoreActions {
  setState: (next: GameState) => void;
  doAdvanceWeek: () => void;
  doAdvanceDay: () => void;
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

    initialize: () => {
      migrateLegacySave();
      const slotId = getActiveSlot();
      if (slotId) {
        loadFromSlot(slotId).then((loaded) => {
          if (loaded) {
            set((draft) => {
              draft.state = loaded;
              draft.activeSlotId = slotId;
              draft.atTitleScreen = !listSaveSlots().some((s) => s.slotId === slotId);
            });
          }
        });
      }
    },

    loadGame: (slotId: string, state: GameState) => {
      saveToSlot(slotId, state);
      set((draft) => {
        draft.state = state;
        draft.activeSlotId = slotId;
        draft.atTitleScreen = false;
        draft.lastSavedAt = new Date().toISOString();
      });
    },

    setState: (next: GameState) => {
      const { activeSlotId } = get();
      if (activeSlotId) {
        saveToSlot(activeSlotId, next);
      }
      set((draft) => {
        draft.state = next;
        draft.lastSavedAt = new Date().toISOString();
      });
    },

    doAdvanceWeek: () => {
      set((draft) => {
        // If it's a tournament week, we forced daily progression.
        // But if the user somehow triggers a week advance, we should resolve all 7 days.
        let next = draft.state;
        if (next.isTournamentWeek) {
          for (let i = next.day; i < 7; i++) {
            next = advanceDay(next);
          }
        } else {
          next = advanceWeek(next);
        }
        
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doAdvanceDay: () => {
      set((draft) => {
        const next = advanceDay(draft.state);
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doAppendFight: (summary: FightSummary) => {
      set((draft) => {
        const next = appendFightToHistory(draft.state, summary);
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
          draft.lastSavedAt = new Date().toISOString();
        }
      });
    },

    doUpdateWarrior: (warriorId: string, won: boolean, killed: boolean, fameDelta: number, popDelta: number) => {
      set((draft) => {
        const next = updateWarriorAfterFight(draft.state, warriorId, won, killed, fameDelta, popDelta);
        draft.state = next;
        const { activeSlotId } = draft;
        if (activeSlotId) {
          saveToSlot(activeSlotId, next);
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
        // Also save if in a slot
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
    doConsumeInsightToken: (tokenId: string, warriorId: string) => {
      set((draft) => {
        const next = consumeInsightToken(draft.state, tokenId, warriorId);
        draft.state = next;
        if (draft.activeSlotId) saveToSlot(draft.activeSlotId, next);
        draft.lastSavedAt = new Date().toISOString();
      });
    },
  }))
);

export const useGame = useGameStore;
