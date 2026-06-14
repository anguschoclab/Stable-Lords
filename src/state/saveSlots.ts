import type { GameState } from '@/types/state.types';
import { archiveService } from '@/engine/storage/archiveService';
import { truncateState } from '@/engine/storage/truncation';
import { STORE_KEYS } from '@/constants/core/storeKeys';
import { GameStateSchema, SaveSlotMetaSchema } from '@/schemas/gameStateSchema';

/**
 * Defines the shape of save slot meta.
 */
export interface SaveSlotMeta {
  id: string;
  name: string;
  week: number;
  year: number;
  timestamp: string;
  version: string;
}

const STORAGE_KEY = STORE_KEYS.SAVE_SLOTS; /**
                                            * Max_save_slots.
                                            */

/**
 * Max_save_slots.
 */
export const MAX_SAVE_SLOTS = 10;

async function getStoredMeta(): Promise<SaveSlotMeta[]> {
  // Try electron-store first (Electron environment)
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const stored = await window.electronAPI.storeGet(STORAGE_KEY);
      if (stored) return SaveSlotMetaSchema.array().parse(stored);
    } catch (e) {
      console.error('Failed to parse save slot metadata from electron-store', e);
    }
    return [];
  }

  // Fallback to localStorage (web environment)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return SaveSlotMetaSchema.array().parse(JSON.parse(stored));
  } catch (e) {
    console.error('Failed to parse save slot metadata from localStorage', e);
    return [];
  }
}

async function setStoredMeta(meta: SaveSlotMeta[]) {
  // Try electron-store first (Electron environment)
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      await window.electronAPI.storeSet(STORAGE_KEY, meta);
    } catch (error) {
      console.error('Failed to save save slot metadata to electron-store', error);
    }
    return;
  }

  // Fallback to localStorage (web environment)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch (error) {
    if ((error as Error)?.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded when saving save slot metadata', error);
      // Attempt to clear old save slots to free up space
      try {
        const existing = await getStoredMeta();
        if (existing.length > 0) {
          // Keep only the most recent save slot
          const mostRecent = existing.slice(-1);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mostRecent));
        }
      } catch (retryError) {
        console.error('Failed to recover from localStorage quota error', retryError);
      }
    } else {
      console.error('Failed to save save slot metadata', error);
    }
  }
} /**
   * List save slots.
   * @returns The result.
   */

/**
 * List save slots.
 * @returns The result.
 */
export async function listSaveSlots(): Promise<SaveSlotMeta[]> {
  return await getStoredMeta();
} /**
   * Save to slot.
   * @param slotId - Slot id.
   * @param name - Name.
   * @param state - State.
   * @returns The result.
   */

/**
 * Save to slot.
 * @param slotId - Slot id.
 * @param name - Name.
 * @param state - State.
 * @returns The result.
 */
export async function saveToSlot(slotId: string, name: string, state: GameState) {
  const meta: SaveSlotMeta = {
    id: slotId,
    name,
    week: state.week,
    year: state.year,
    timestamp: new Date().toISOString(),
    version: state.meta.version,
  };

  const currentMeta = await getStoredMeta();
  const index = currentMeta.findIndex((m) => m.id === slotId);

  if (index !== -1) {
    currentMeta[index] = meta;
  } else {
    currentMeta.push(meta);
  }

  await setStoredMeta(currentMeta);

  // Truncate state to keep save file size manageable
  const truncatedState = truncateState(state);
  await archiveService.archiveHotState(slotId, truncatedState);
} /**
   * Load from slot.
   * @param slotId - Slot id.
   * @returns The result.
   */

/**
 * Load from slot.
 * @param slotId - Slot id.
 * @returns The result.
 */
export async function loadFromSlot(slotId: string): Promise<GameState | null> {
  return await archiveService.retrieveHotState(slotId);
} /**
   * Delete slot.
   * @param slotId - Slot id.
   * @returns The result.
   */

/**
 * Delete slot.
 * @param slotId - Slot id.
 * @returns The result.
 */
export async function deleteSlot(slotId: string) {
  const currentMeta = await getStoredMeta();
  const filtered = currentMeta.filter((m) => m.id !== slotId);
  await setStoredMeta(filtered);

  // Delete the actual save file from disk
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      await window.electronAPI.deleteSave(slotId);
    } catch (error) {
      console.error('Failed to delete save file from disk:', error);
    }
  }
} /**
   * New slot id.
   * @returns The result.
   */

/**
 * New slot id.
 * @returns The result.
 */
export function newSlotId(): string {
  return `slot_${crypto.randomUUID()}`;
} /**
   * Export slot.
   * @param slotId - Slot id.
   * @returns The result.
   */

/**
 * Export slot.
 * @param slotId - Slot id.
 * @returns The result.
 */
export async function exportSlot(slotId: string): Promise<string | null> {
  const state = await loadFromSlot(slotId);
  if (!state) return null;
  // Truncate state to keep export file size manageable
  const truncatedState = truncateState(state);
  return JSON.stringify(truncatedState);
} /**
   * Import save to new slot.
   * @param data - Data.
   * @returns The result.
   */

/**
 * Import save to new slot.
 * @param data - Data.
 * @returns The result.
 */
export async function importSaveToNewSlot(data: unknown): Promise<string | null> {
  try {
    const state = typeof data === 'string' ? JSON.parse(data) : data;
    const validatedState = GameStateSchema.parse(state) as GameState;

    const slotId = newSlotId();
    await saveToSlot(slotId, `Imported: ${validatedState.player.stableName}`, validatedState);
    return slotId;
  } catch (e) {
    console.error('Import failed', e);
    return null;
  }
}
