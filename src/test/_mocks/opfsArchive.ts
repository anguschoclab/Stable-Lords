import { vi } from 'vitest';

/** Shared stub for @/engine/storage/opfsArchive — all archives resolve empty. */
const m: Record<string, any> = {
  archiveBoutLog: vi.fn().mockResolvedValue(undefined),
  retrieveBoutLog: vi.fn().mockResolvedValue(null),
  archiveHotState: vi.fn().mockResolvedValue(undefined),
  retrieveHotState: vi.fn().mockResolvedValue(null),
  getArchivedBoutIdsForSeason: vi.fn().mockResolvedValue([]),
};

/** Helper. */
export class OPFSArchiveService {
  isSupported = () => true;
  archiveBoutLog = m.archiveBoutLog;
  retrieveBoutLog = m.retrieveBoutLog;
  archiveHotState = m.archiveHotState;
  retrieveHotState = m.retrieveHotState;
  getArchivedBoutIdsForSeason = m.getArchivedBoutIdsForSeason;
}
export const opfsArchive = m;
/** Helper. */
export class ArchiveConflictError extends Error {}
export const assertSafeFileNamePart: (...args: any[]) => void = vi.fn();
