/**
 * Stable Lords — Multi-Slot Save/Load System
 * Manages up to 5 save slots in localStorage.
 */
import type { GameState } from "@/types/game";

const SLOTS_INDEX_KEY = "stablelords.slots";
const SLOT_PREFIX = "stablelords.slot.";
const ACTIVE_SLOT_KEY = "stablelords.activeSlot";
export const MAX_SAVE_SLOTS = 5;

export interface SaveSlotMeta {
  slotId: string;
  stableName: string;
  ownerName: string;
  week: number;
  season: string;
  rosterSize: number;
  fame: number;
  ftueComplete: boolean;
  savedAt: string;
  createdAt: string;
}

/** Get all save slot metadata */
export function listSaveSlots(): SaveSlotMeta[] {
  try {
    const raw = localStorage.getItem(SLOTS_INDEX_KEY);
    if (raw) return JSON.parse(raw) as SaveSlotMeta[];
  } catch { /* corrupt */ }
  return [];
}

function persistSlotIndex(slots: SaveSlotMeta[]) {
  localStorage.setItem(SLOTS_INDEX_KEY, JSON.stringify(slots));
}

/** Extract metadata from a game state for the slot index */
function metaFromState(slotId: string, state: GameState, existingCreatedAt?: string): SaveSlotMeta {
  return {
    slotId,
    stableName: state.player.stableName,
    ownerName: state.player.name,
    week: state.week,
    season: state.season,
    rosterSize: state.roster.length,
    fame: state.fame,
    ftueComplete: state.ftueComplete,
    savedAt: new Date().toISOString(),
    createdAt: existingCreatedAt ?? state.meta.createdAt,
  };
}

/** Save game state to a specific slot */
export function saveToSlot(slotId: string, state: GameState): void {
  localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(state));
  const slots = listSaveSlots();
  const existingIdx = slots.findIndex((s) => s.slotId === slotId);
  const existing = existingIdx >= 0 ? slots[existingIdx] : undefined;
  const meta = metaFromState(slotId, state, existing?.createdAt);
  if (existingIdx >= 0) {
    slots[existingIdx] = meta;
  } else {
    slots.push(meta);
  }
  persistSlotIndex(slots);
  setActiveSlot(slotId);
}

/** Load game state from a specific slot */
export function loadFromSlot(slotId: string): GameState | null {
  try {
    const raw = localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.meta) {
        // Migration
        if (!parsed.graveyard) parsed.graveyard = [];
        if (!parsed.retired) parsed.retired = [];
        if (!parsed.crowdMood) parsed.crowdMood = "Calm";
        if (!parsed.tournaments) parsed.tournaments = [];
        if (!parsed.trainers) parsed.trainers = [];
        if (!parsed.hiringPool) parsed.hiringPool = [];
        if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
        if (!parsed.coachDismissed) parsed.coachDismissed = [];
        parsed.roster = (parsed.roster || []).map((w: any) => ({ ...w, status: w.status || "Active" }));
        return parsed as GameState;
      }
    }
  } catch { /* corrupt */ }
  return null;
}

/** Delete a save slot */
export function deleteSlot(slotId: string): void {
  localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
  const slots = listSaveSlots().filter((s) => s.slotId !== slotId);
  persistSlotIndex(slots);
  // Clear active if it was this slot
  if (getActiveSlot() === slotId) {
    localStorage.removeItem(ACTIVE_SLOT_KEY);
  }
}

/** Get/set which slot is currently active */
export function getActiveSlot(): string | null {
  return localStorage.getItem(ACTIVE_SLOT_KEY);
}

export function setActiveSlot(slotId: string): void {
  localStorage.setItem(ACTIVE_SLOT_KEY, slotId);
}

/** Generate a unique slot ID */
export function newSlotId(): string {
  return `slot_${Date.now()}_${Math.floor(Math.random() * 1e4)}`;
}

/**
 * Migrate legacy single-save to slot system.
 * If old save exists and no slots exist, move it to slot 1.
 */
export function migrateLegacySave(): void {
  const LEGACY_KEY = "stablelords.save.v2";
  const slots = listSaveSlots();
  if (slots.length > 0) return; // already migrated

  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed?.meta) return;

    const slotId = "slot_legacy";
    localStorage.setItem(`${SLOT_PREFIX}${slotId}`, raw);

    // Migration fields
    if (parsed.ftueComplete === undefined) parsed.ftueComplete = true;
    if (!parsed.coachDismissed) parsed.coachDismissed = [];

    const meta = metaFromState(slotId, parsed as GameState);
    persistSlotIndex([meta]);
    setActiveSlot(slotId);

    // Clean up legacy key
    localStorage.removeItem(LEGACY_KEY);
  } catch { /* ignore */ }
}
