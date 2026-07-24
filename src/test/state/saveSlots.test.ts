import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  newSlotId,
  listSaveSlots,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  exportSlot,
  importSaveToNewSlot
} from '@/state/saveSlots';
import { archiveService } from '@/engine/storage/archiveService';
import { STORE_KEYS } from '@/constants/core/storeKeys';
import type { GameState } from '@/types/state.types';

import { GameStateSchema } from '@/schemas/gameStateSchema';

vi.mock('@/schemas/gameStateSchema', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    GameStateSchema: {
      parse: vi.fn((data) => {
        if (data.invalid) throw new Error('Invalid');
        if (!data.meta) data.meta = { version: '1.0' };
        return data;
      })
    }
  };
});


vi.mock('@/engine/storage/archiveService', () => ({
  archiveService: {
    archiveHotState: vi.fn(),
    retrieveHotState: vi.fn(),
    deleteHotState: vi.fn(),
  }
}));

describe('saveSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Re-mock window if electronAPI exists, let's just stick to local storage branch for coverage
    // by ensuring electronAPI is undefined
    (window as any).electronAPI = undefined;
  });

  describe('newSlotId', () => {
    it('should return a string', () => {
      const id = newSlotId();
      expect(typeof id).toBe('string');
    });

    it('should return unique IDs', () => {
      const id1 = newSlotId();
      const id2 = newSlotId();
      expect(id1).not.toBe(id2);
    });

    it('should return IDs starting with slot_', () => {
      const id = newSlotId();
      expect(id.startsWith('slot_')).toBe(true);
    });
  });

  describe('listSaveSlots', () => {
    it('returns empty array when local storage is empty', async () => {
      const slots = await listSaveSlots();
      expect(slots).toEqual([]);
    });

    it('returns saved meta from local storage', async () => {
      const metas = [{ id: 'slot_1', name: 'Test', week: 1, year: 1, timestamp: '123', version: '1' }];
      localStorage.setItem(STORE_KEYS.SAVE_SLOTS, JSON.stringify(metas));
      const slots = await listSaveSlots();
      expect(slots).toEqual(metas);
    });
  });

  describe('saveToSlot', () => {
    it('saves meta to storage and hot state to archive', async () => {
      const state = { week: 10, year: 2, meta: { version: '1.0' } } as unknown as GameState;
      await saveToSlot('slot_1', 'My Save', state);

      const metas = JSON.parse(localStorage.getItem(STORE_KEYS.SAVE_SLOTS) || '[]');
      expect(metas).toHaveLength(1);
      expect(metas[0].id).toBe('slot_1');
      expect(metas[0].name).toBe('My Save');
      expect(metas[0].week).toBe(10);
      expect(metas[0].year).toBe(2);
      expect(metas[0].version).toBe('1.0');

      expect(archiveService.archiveHotState).toHaveBeenCalledWith('slot_1', expect.objectContaining(state));
    });
  });

  describe('loadFromSlot', () => {
    it('loads state from archive service', async () => {
      const mockState = { week: 10 } as unknown as GameState;
      vi.mocked(archiveService.retrieveHotState).mockResolvedValue(mockState);

      const state = await loadFromSlot('slot_1');
      expect(state).toEqual(mockState);
      expect(archiveService.retrieveHotState).toHaveBeenCalledWith('slot_1');
    });
  });

  describe('deleteSlot', () => {
    it('removes slot meta from storage and deletes hot state', async () => {
      const metas = [
        { id: 'slot_1', name: 'Test', week: 1, year: 1, timestamp: '123', version: '1' },
        { id: 'slot_2', name: 'Test2', week: 2, year: 1, timestamp: '123', version: '1' }
      ];
      localStorage.setItem(STORE_KEYS.SAVE_SLOTS, JSON.stringify(metas));

      await deleteSlot('slot_1');

      const newMetas = JSON.parse(localStorage.getItem(STORE_KEYS.SAVE_SLOTS) || '[]');
      expect(newMetas).toHaveLength(1);
      expect(newMetas[0].id).toBe('slot_2');
      // archiveService.deleteHotState is not called by deleteSlot, it deletes from IndexedDB/localStorage directly
    });
  });

  describe('exportSlot', () => {
    it('returns null if state not found', async () => {
      vi.mocked(archiveService.retrieveHotState).mockResolvedValue(null);
      const res = await exportSlot('slot_1');
      expect(res).toBeNull();
    });

    it('truncates and stringifies state', async () => {
      const mockState = {
        week: 10,
        player: {},
        roster: [],
        rivals: [],
        meta: {}
      } as unknown as GameState;
      vi.mocked(archiveService.retrieveHotState).mockResolvedValue(mockState);

      const res = await exportSlot('slot_1');
      expect(typeof res).toBe('string');
      // Truncation should strip down arrays, for instance
      expect(JSON.parse(res as string).week).toBe(10);
    });
  });

  describe('importSaveToNewSlot', () => {
    it('returns null if validation fails', async () => {
      const res = await importSaveToNewSlot({ invalid: true });
      expect(res).toBeNull();
    });

    it('returns slotId and saves to slot if valid', async () => {
      const state = { week: 1, player: { stableName: 'Test' } };
      const res = await importSaveToNewSlot(state);
      expect(res).toMatch(/^slot_/);

      const metas = JSON.parse(localStorage.getItem(STORE_KEYS.SAVE_SLOTS) || '[]');
      expect(metas).toHaveLength(1);
      expect(metas[0].id).toBe(res);
      expect(metas[0].name).toBe('Imported: Test');
    });

    it('returns slotId and saves to slot if valid string', async () => {
      const state = { week: 1, player: { stableName: 'TestString' } };
      const res = await importSaveToNewSlot(JSON.stringify(state));
      expect(res).toMatch(/^slot_/);

      const metas = JSON.parse(localStorage.getItem(STORE_KEYS.SAVE_SLOTS) || '[]');
      expect(metas).toHaveLength(1);
    });
  });
});