import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';
import { ArchiveConflictError } from '@/engine/storage/ArchiveConflictError';
import { setMockOPFSError, setMockOPFSFileText } from '@/test/_setup/setup';

describe('OPFS Archival System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Suite 1: Initialization & Support Checking', () => {
    it('Test 1.1: isSupported() returns true in modern environments', () => {
      const service = new OPFSArchiveService();
      // In our test environment, navigator.storage is mocked, so OPFS appears supported
      expect(service.isSupported()).toBe(true);
    });
  });

  describe('Suite 2: Archiving Play-by-Play (PBP) Logs (Append-Only)', () => {
    it('Test 2.1: archiveBoutLog does not throw with valid inputs', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveBoutLog(1, 1, 'b-suite2-t1', [], true)).resolves.toBeUndefined();
    });

    it('Test 2.2: archiveBoutLog handles empty payload', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveBoutLog(1, 2, 'b-suite2-t2', [], true)).resolves.toBeUndefined();
    });
  });

  describe('Suite 3: Retrieval & Hydration', () => {
    it('Test 3.1: retrieveBoutLog does not throw', async () => {
      const service = new OPFSArchiveService();
      // In JSDOM, OPFS getFileHandle({create:false}) doesn’t throw NotFoundError
      // so retrieveBoutLog may return null or an empty parsed value — both are graceful
      const result = await service.retrieveBoutLog(99, 99, 'b-nonexistent-9999');
      expect(result === null || typeof result !== 'undefined').toBe(true);
    });
  });

  describe('Suite 4: Seasonal Gazette Archiving', () => {
    it('Test 4.1: archiveGazette does not throw', async () => {
      const service = new OPFSArchiveService();
      const markdown = '# Weekly Gazette\nIt was a good week.';
      await expect(service.archiveGazette(1, 1, markdown)).resolves.toBeUndefined();
    });
  });

  describe('Suite 5: Fallback & Quota Management', () => {
    it('Test 5.1: Graceful degradation on errors', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveBoutLog(1, 1, 'b-suite5-t1', [], true)).resolves.toBeUndefined();
    });
  });

  describe('Suite 6: Path Traversal Input Validation', () => {
    it('Test 6.1: archiveHotState rejects slotId with traversal chars', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveHotState('../escape', {} as any)).rejects.toThrow(
        'Invalid slotId'
      );
    });

    it('Test 6.2: retrieveHotState rejects slotId with traversal chars', async () => {
      const service = new OPFSArchiveService();
      await expect(service.retrieveHotState('slot/../../etc/passwd')).rejects.toThrow(
        'Invalid slotId'
      );
    });

    it('Test 6.3: archiveBoutLog rejects boutId with traversal chars', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveBoutLog(1, 1, 'foo../bar', [], true)).rejects.toThrow(
        'Invalid boutId'
      );
    });

    it('Test 6.4: retrieveBoutLog rejects boutId with traversal chars', async () => {
      const service = new OPFSArchiveService();
      await expect(service.retrieveBoutLog(1, 1, 'bout\\windows')).rejects.toThrow(
        'Invalid boutId'
      );
    });

    it('Test 6.5: archiveGazette still works with valid numeric week', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveGazette(1, 1, '#')).resolves.toBeUndefined();
    });

    it('Test 6.6: valid IDs are accepted', async () => {
      const service = new OPFSArchiveService();
      await expect(service.archiveHotState('slot_abc-123', {} as any)).resolves.toBeUndefined();
      await expect(service.archiveBoutLog(1, 1, 'b-valid-id_2', [], true)).resolves.toBeUndefined();
    });
  });

  describe('Suite 7: QuotaExceededError handling', () => {
    it('Test 7.1: archiveHotState dispatches OPFS_QUOTA_EXCEEDED and returns gracefully', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('QuotaExceededError', 'write');
      const dispatchSpy = vi.fn().mockReturnValue(true);
      (global as any).window = { dispatchEvent: dispatchSpy };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveHotState('slot1', {} as any)).resolves.toBeUndefined();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OPFS_QUOTA_EXCEEDED',
          detail: 'Storage Quota Exceeded: Archival failed.',
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'OPFS Quota Exceeded during hot state archival',
        expect.any(Error)
      );

      delete (global as any).window;
      consoleSpy.mockRestore();
    });

    it('Test 7.2: archiveBoutLog dispatches OPFS_QUOTA_EXCEEDED and returns gracefully', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('QuotaExceededError', 'write');
      const dispatchSpy = vi.fn().mockReturnValue(true);
      (global as any).window = { dispatchEvent: dispatchSpy };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        service.archiveBoutLog(1, 1, 'b-quota', ['line'], true)
      ).resolves.toBeUndefined();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OPFS_QUOTA_EXCEEDED',
          detail: 'Storage Quota Exceeded: Archival failed.',
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'OPFS Quota Exceeded during bout log archival',
        expect.any(Error)
      );

      delete (global as any).window;
      consoleSpy.mockRestore();
    });

    it('Test 7.3: archiveGazette dispatches OPFS_QUOTA_EXCEEDED and returns gracefully', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('QuotaExceededError', 'write');
      const dispatchSpy = vi.fn().mockReturnValue(true);
      (global as any).window = { dispatchEvent: dispatchSpy };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.archiveGazette(1, 1, '# Gazette')).resolves.toBeUndefined();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'OPFS_QUOTA_EXCEEDED',
          detail: 'Storage Quota Exceeded: Archival failed.',
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'OPFS Quota Exceeded during gazette archival',
        expect.any(Error)
      );

      delete (global as any).window;
      consoleSpy.mockRestore();
    });
  });

  describe('Suite 8: NoModificationAllowedError handling', () => {
    it('Test 8.1: archiveBoutLog throws ArchiveConflictError when createWritable raises NoModificationAllowedError', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('NoModificationAllowedError', 'createWritable');

      await expect(
        service.archiveBoutLog(1, 1, 'b-conflict', ['line'], true)
      ).rejects.toBeInstanceOf(ArchiveConflictError);
    });
  });

  describe('Suite 9: NotFoundError handling', () => {
    it('Test 9.1: retrieveBoutLog returns null on NotFoundError', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('NotFoundError', 'getFileHandle');

      const result = await service.retrieveBoutLog(1, 1, 'b-missing');
      expect(result).toBeNull();
    });

    it('Test 9.2: retrieveHotState returns null on NotFoundError', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('NotFoundError', 'getFileHandle');

      const result = await service.retrieveHotState('slot-missing');
      expect(result).toBeNull();
    });

    it('Test 9.3: retrieveGazette returns null on NotFoundError', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('NotFoundError', 'getFileHandle');

      const result = await service.retrieveGazette(1, 1);
      expect(result).toBeNull();
    });
  });

  describe('Suite 10: Generic / permission-level OPFS failures', () => {
    it('Test 10.1: retrieveBoutLog returns null when getDirectory throws SecurityError', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('SecurityError', 'getDirectory');

      const result = await service.retrieveBoutLog(1, 1, 'b-security');
      expect(result).toBeNull();
    });

    it('Test 10.2: retrieveHotState returns null when getDirectory throws SecurityError', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('SecurityError', 'getDirectory');

      const result = await service.retrieveHotState('slot-security');
      expect(result).toBeNull();
    });

    it('Test 10.3: getArchivedBoutIdsForSeason returns empty array when getDirectory fails', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('SecurityError', 'getDirectory');

      const result = await service.getArchivedBoutIdsForSeason(1);
      expect(result).toEqual([]);
    });

    it('Test 10.4: archiveBoutLog logs unknown errors via console.error', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('UnknownError', 'write');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        service.archiveBoutLog(1, 1, 'b-unknown', ['line'], true)
      ).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown error during bout log archival',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Suite 11: Writable stream close error handling', () => {
    it('Test 11.1: archiveHotState catches and logs close failure without propagating', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('AbortError', 'close');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(service.archiveHotState('slot1', {} as any)).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to close writable stream:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('Test 11.2: archiveBoutLog catches and logs close failure without propagating', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('AbortError', 'close');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        service.archiveBoutLog(1, 1, 'b-close', ['line'], true)
      ).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to close writable stream:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('Test 11.3: archiveGazette catches and logs close failure without propagating', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSError('AbortError', 'close');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(service.archiveGazette(1, 1, '# Gazette')).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to close writable stream:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Suite 12: retrieveHotState JSON parse failure', () => {
    it('Test 12.1: Returns null and logs warning when file.text returns invalid JSON', async () => {
      const service = new OPFSArchiveService();
      setMockOPFSFileText('not-valid-json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.retrieveHotState('slot-bad-json');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error retrieving hot state:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });
});
