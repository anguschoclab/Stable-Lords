import type { GameState } from '@/types/state.types';
import { ArchiveConflictError } from '../ArchiveConflictError';

export { ArchiveConflictError };

export interface ArchiveService {
  isSupported: () => boolean;

  archiveBoutLog: (
    year: number,
    season: number,
    boutId: string,
    logData: string[],
    overwrite?: boolean
  ) => Promise<void>;
  retrieveBoutLog: (year: number, season: number, boutId: string) => Promise<string[] | null>;

  archiveGazette: (season: number, week: number, markdown: string) => Promise<void>;
  retrieveGazette: (season: number, week: number) => Promise<string | null>;

  archiveHotState: (slotId: string, stateData: GameState) => Promise<void>;
  retrieveHotState: (slotId: string) => Promise<GameState | null>;

  getArchivedBoutIdsForSeason: (season: number) => Promise<string[]>;
}
