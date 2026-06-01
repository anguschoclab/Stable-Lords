import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElectronArchiveService } from '@/engine/storage/electronArchive';
import '@/test/setup';

function createMockElectronAPI(overrides?: Partial<typeof window.electronAPI>) {
  return {
    saveGame: vi.fn().mockResolvedValue({ success: true }),
    loadGame: vi.fn().mockResolvedValue({ success: true, data: {} }),
    archiveBoutLog: vi.fn().mockResolvedValue({ success: true }),
    retrieveBoutLog: vi.fn().mockResolvedValue({ success: true, data: [] }),
    archiveGazette: vi.fn().mockResolvedValue({ success: true }),
    retrieveGazette: vi.fn().mockResolvedValue({ success: true, data: '' }),
    ...overrides,
  } as unknown as typeof window.electronAPI;
}

describe('ElectronArchiveService', () => {
  let service: ElectronArchiveService;
  let originalWindow: typeof window;

  beforeEach(() => {
    originalWindow = (global as any).window;
    service = new ElectronArchiveService();
  });

  afterEach(() => {
    (global as any).window = originalWindow;
    vi.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 1: isSupported()
  // ───────────────────────────────────────────────────────────────────────────
  describe('isSupported()', () => {
    it('returns true when window.electronAPI is defined', () => {
      (global as any).window = { electronAPI: createMockElectronAPI() };
      expect(service.isSupported()).toBe(true);
    });

    it('returns false when window.electronAPI is undefined', () => {
      (global as any).window = { electronAPI: undefined };
      expect(service.isSupported()).toBe(false);
    });

    it('returns false when typeof window === "undefined"', () => {
      (global as any).window = undefined;
      expect(service.isSupported()).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 2: archiveHotState error paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('archiveHotState', () => {
    it('catches thrown error, logs it, and resolves gracefully', async () => {
      const error = new Error('IPC failure');
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          saveGame: vi.fn().mockRejectedValue(error),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveHotState('slot1', {} as any)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Error archiving hot state:', error);

      consoleSpy.mockRestore();
    });

    it('handles { success: false } response, logs error, and resolves gracefully', async () => {
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          saveGame: vi.fn().mockResolvedValue({ success: false, error: 'disk full' }),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveHotState('slot1', {} as any)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to archive hot state:', 'disk full');

      consoleSpy.mockRestore();
    });

    it('returns immediately when !isSupported()', async () => {
      (global as any).window = { electronAPI: undefined };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveHotState('slot1', {} as any)).resolves.toBeUndefined();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 3: retrieveHotState error paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('retrieveHotState', () => {
    it('catches thrown error, logs it, and returns null', async () => {
      const error = new Error('IPC failure');
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          loadGame: vi.fn().mockRejectedValue(error),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.retrieveHotState('slot1');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error retrieving hot state:', error);

      consoleSpy.mockRestore();
    });

    it('returns null when !isSupported()', async () => {
      (global as any).window = { electronAPI: undefined };

      const result = await service.retrieveHotState('slot1');
      expect(result).toBeNull();
    });

    it('returns null when result has { success: false }', async () => {
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          loadGame: vi.fn().mockResolvedValue({ success: false, error: 'not found' }),
        }),
      };

      const result = await service.retrieveHotState('slot1');
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 4: archiveBoutLog error paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('archiveBoutLog', () => {
    it('catches thrown error, logs it, and resolves gracefully', async () => {
      const error = new Error('IPC failure');
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          archiveBoutLog: vi.fn().mockRejectedValue(error),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveBoutLog(1, 1, 'bout1', ['line'], true)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Error archiving bout log:', error);

      consoleSpy.mockRestore();
    });

    it('handles { success: false } response, logs error, and resolves gracefully', async () => {
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          archiveBoutLog: vi.fn().mockResolvedValue({ success: false, error: 'disk full' }),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveBoutLog(1, 1, 'bout1', ['line'], true)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to archive bout log:', 'disk full');

      consoleSpy.mockRestore();
    });

    it('returns immediately when !isSupported()', async () => {
      (global as any).window = { electronAPI: undefined };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveBoutLog(1, 1, 'bout1', ['line'], true)).resolves.toBeUndefined();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 5: retrieveBoutLog error paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('retrieveBoutLog', () => {
    it('catches thrown error, logs it, and returns null', async () => {
      const error = new Error('IPC failure');
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          retrieveBoutLog: vi.fn().mockRejectedValue(error),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.retrieveBoutLog(1, 1, 'bout1');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error retrieving bout log:', error);

      consoleSpy.mockRestore();
    });

    it('returns null when !isSupported()', async () => {
      (global as any).window = { electronAPI: undefined };

      const result = await service.retrieveBoutLog(1, 1, 'bout1');
      expect(result).toBeNull();
    });

    it('returns null when result has { success: false }', async () => {
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          retrieveBoutLog: vi.fn().mockResolvedValue({ success: false, error: 'not found' }),
        }),
      };

      const result = await service.retrieveBoutLog(1, 1, 'bout1');
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 6: archiveGazette error paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('archiveGazette', () => {
    it('catches thrown error, logs it, and resolves gracefully', async () => {
      const error = new Error('IPC failure');
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          archiveGazette: vi.fn().mockRejectedValue(error),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveGazette(1, 1, '# Gazette')).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Error archiving gazette:', error);

      consoleSpy.mockRestore();
    });

    it('handles { success: false } response, logs error, and resolves gracefully', async () => {
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          archiveGazette: vi.fn().mockResolvedValue({ success: false, error: 'disk full' }),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveGazette(1, 1, '# Gazette')).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to archive gazette:', 'disk full');

      consoleSpy.mockRestore();
    });

    it('returns immediately when !isSupported()', async () => {
      (global as any).window = { electronAPI: undefined };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveGazette(1, 1, '# Gazette')).resolves.toBeUndefined();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 7: retrieveGazette error paths
  // ───────────────────────────────────────────────────────────────────────────
  describe('retrieveGazette', () => {
    it('catches thrown error, logs it, and returns null', async () => {
      const error = new Error('IPC failure');
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          retrieveGazette: vi.fn().mockRejectedValue(error),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await service.retrieveGazette(1, 1);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error retrieving gazette:', error);

      consoleSpy.mockRestore();
    });

    it('returns null when !isSupported()', async () => {
      (global as any).window = { electronAPI: undefined };

      const result = await service.retrieveGazette(1, 1);
      expect(result).toBeNull();
    });

    it('returns null when result has { success: false }', async () => {
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          retrieveGazette: vi.fn().mockResolvedValue({ success: false, error: 'not found' }),
        }),
      };

      const result = await service.retrieveGazette(1, 1);
      expect(result).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 8: getArchivedBoutIdsForSeason
  // ───────────────────────────────────────────────────────────────────────────
  describe('getArchivedBoutIdsForSeason', () => {
    it('always returns an empty array (stub)', async () => {
      const result = await service.getArchivedBoutIdsForSeason(1);
      expect(result).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Suite 9: enqueue write queue behavior
  // ───────────────────────────────────────────────────────────────────────────
  describe('enqueue write queue', () => {
    it('serializes sequential archive calls', async () => {
      const order: string[] = [];
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          saveGame: vi.fn().mockImplementation(async () => {
            order.push('a');
            await new Promise((r) => setTimeout(r, 10));
            order.push('b');
            return { success: true };
          }),
        }),
      };

      const p1 = service.archiveHotState('slot1', {} as any);
      const p2 = service.archiveHotState('slot2', {} as any);

      await Promise.all([p1, p2]);
      // Both calls should complete in order; 'a' from first call must come before 'a' from second
      expect(order).toEqual(['a', 'b', 'a', 'b']);
    });

    it('continues queue even when a prior task inner-catch swallows an error', async () => {
      let callCount = 0;
      (global as any).window = {
        electronAPI: createMockElectronAPI({
          saveGame: vi.fn().mockImplementation(async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('first fails');
            }
            return { success: true };
          }),
        }),
      };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const p1 = service.archiveHotState('slot1', {} as any);
      const p2 = service.archiveHotState('slot2', {} as any);

      await expect(p1).resolves.toBeUndefined();
      await expect(p2).resolves.toBeUndefined();
      expect(callCount).toBe(2);

      consoleSpy.mockRestore();
    });
  });
});
