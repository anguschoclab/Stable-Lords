import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  newSlotId,
  listSaveSlots,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  exportSlot,
  importSaveToNewSlot,
} from '@/state/saveSlots';
import { archiveService } from '@/engine/storage/archiveService';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { STORE_KEYS } from '@/constants/core/storeKeys';
import type { GameState } from '@/types/state.types';

vi.mock('@/engine/storage/archiveService', () => ({
  archiveService: {
    archiveHotState: vi.fn(),
    retrieveHotState: vi.fn(),
    deleteHotState: vi.fn(),
  },
}));

describe('saveSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Control GameStateSchema.parse for the import paths while keeping every
    // other schema method real. (spyOn works on both runners; vi.mock's
    // importOriginal arg does not exist under bun:test.)
    vi.spyOn(GameStateSchema, 'parse').mockImplementation((data: unknown) => {
      const d = data as { invalid?: boolean; meta?: { version: string } };
      if (d.invalid) throw new Error('Invalid');
      if (!d.meta) d.meta = { version: '1.0' };
      return d as never;
    });
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
      const metas = [
        { id: 'slot_1', name: 'Test', week: 1, year: 1, timestamp: '123', version: '1' },
      ];
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

      expect(archiveService.archiveHotState).toHaveBeenCalledWith(
        'slot_1',
        expect.objectContaining(state)
      );
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
        { id: 'slot_2', name: 'Test2', week: 2, year: 1, timestamp: '123', version: '1' },
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
        meta: {},
      } as unknown as GameState;
      vi.mocked(archiveService.retrieveHotState).mockResolvedValue(mockState);

      const res = await exportSlot('slot_1');
      expect(typeof res).toBe('string');
      // Truncation should strip down arrays, for instance
      expect(JSON.parse(res as string).week).toBe(10);
    });
  });

  describe('quota recovery (setStoredMeta)', () => {
    const quotaError = () =>
      Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' });

    const seedMetas = (metas: Array<Record<string, unknown>>) => {
      localStorage.setItem(STORE_KEYS.SAVE_SLOTS, JSON.stringify(metas));
    };

    const meta = (id: string) => ({
      id,
      name: `Save ${id}`,
      week: 1,
      year: 1,
      timestamp: '2024-01-01',
      version: '1',
    });

    it('saveToSlot keeps only the most recent existing slot when quota is exceeded', async () => {
      const metas = [meta('slot_1'), meta('slot_2'), meta('slot_3')];
      seedMetas(metas);

      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw quotaError();
        });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = { week: 1, year: 1, meta: { version: '1' } } as unknown as GameState;
      await saveToSlot('slot_new', 'New Save', state);

      // First attempt wrote all 4 metas and threw; recovery re-reads the OLD
      // stored array and retries with only the most recent existing slot.
      expect(setItemSpy).toHaveBeenCalledTimes(2);
      expect(setItemSpy).toHaveBeenLastCalledWith(
        STORE_KEYS.SAVE_SLOTS,
        JSON.stringify([metas[2]])
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'localStorage quota exceeded when saving save slot metadata',
        expect.any(Error)
      );

      const stored = JSON.parse(localStorage.getItem(STORE_KEYS.SAVE_SLOTS) || '[]');
      expect(stored).toEqual([metas[2]]);
    });

    it('deleteSlot applies the same quota recovery', async () => {
      const metas = [meta('slot_1'), meta('slot_2'), meta('slot_3')];
      seedMetas(metas);

      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw quotaError();
        });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await deleteSlot('slot_1');

      expect(setItemSpy).toHaveBeenCalledTimes(2);
      expect(setItemSpy).toHaveBeenLastCalledWith(
        STORE_KEYS.SAVE_SLOTS,
        JSON.stringify([metas[2]])
      );
    });

    it('does not retry when quota is exceeded and no existing metas are stored', async () => {
      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw quotaError();
        });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = { week: 1, year: 1, meta: { version: '1' } } as unknown as GameState;
      await saveToSlot('slot_1', 'Save', state);

      expect(setItemSpy).toHaveBeenCalledTimes(1);
    });

    it('logs a generic error and does not retry for non-quota failures', async () => {
      seedMetas([meta('slot_1')]);

      const setItemSpy = vi
        .spyOn(localStorage, 'setItem')
        .mockImplementationOnce(() => {
          throw new Error('boom');
        });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = { week: 1, year: 1, meta: { version: '1' } } as unknown as GameState;
      await expect(saveToSlot('slot_2', 'Save', state)).resolves.toBeUndefined();

      expect(setItemSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save save slot metadata',
        expect.any(Error)
      );
    });

    it('logs a recovery failure when the quota retry also throws', async () => {
      seedMetas([meta('slot_1'), meta('slot_2')]);

      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw quotaError();
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = { week: 1, year: 1, meta: { version: '1' } } as unknown as GameState;
      await expect(saveToSlot('slot_3', 'Save', state)).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to recover from localStorage quota error',
        expect.any(Error)
      );
      // setStoredMeta swallowed the error, so the hot state is still archived
      expect(archiveService.archiveHotState).toHaveBeenCalledWith(
        'slot_3',
        expect.objectContaining(state)
      );
    });
  });

  describe('electron-store error paths', () => {
    afterEach(() => {
      (window as any).electronAPI = undefined;
    });

    it('listSaveSlots logs and returns [] when electron-store data fails schema parse', async () => {
      (window as any).electronAPI = {
        storeGet: vi.fn().mockResolvedValue({ not: 'an array' }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const slots = await listSaveSlots();

      expect(slots).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse save slot metadata from electron-store',
        expect.any(Error)
      );
    });

    it('saveToSlot logs when electron-store write fails', async () => {
      (window as any).electronAPI = {
        storeGet: vi.fn().mockResolvedValue([]),
        storeSet: vi.fn().mockRejectedValue(new Error('disk full')),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const state = { week: 1, year: 1, meta: { version: '1' } } as unknown as GameState;
      await expect(saveToSlot('slot_1', 'Save', state)).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save save slot metadata to electron-store',
        expect.any(Error)
      );
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
