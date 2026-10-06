import type { GameState } from '@/types/state.types';
import { ArchiveConflictError } from './ArchiveConflictError';
import type { ArchiveService } from './opfsArchive/types';

export { ArchiveConflictError };
export type { ArchiveService };

/**
 * The ElectronArchiveService class.
 */
export class ElectronArchiveService implements ArchiveService {
  private writeQueue: Promise<unknown> = Promise.resolve();

  /**
   * Enqueue.
   */
  private async enqueue<T>(task: () => Promise<T>): Promise<T> {
    const p = this.writeQueue.then(task);
    this.writeQueue = p.catch(() => {}); // catch errors to allow next task in queue
    return p;
  }

  /**
   * Is supported.
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && window.electronAPI !== undefined;
  }

  /**
   * Archive hot state.
   */
  async archiveHotState(slotId: string, stateData: GameState): Promise<void> {
    return this.enqueue(async () => {
      if (!this.isSupported() || !window.electronAPI) return;

      try {
        const result = await window.electronAPI.saveGame(slotId, stateData);
        if (!result.success) {
          console.error('Failed to archive hot state:', result.error);
        }
      } catch (error) {
        console.error('Error archiving hot state:', error);
      }
    });
  }

  /**
   * Retrieve hot state.
   */
  async retrieveHotState(slotId: string): Promise<GameState | null> {
    if (!this.isSupported() || !window.electronAPI) return null;

    try {
      const result = await window.electronAPI.loadGame(slotId);
      if (result.success && result.data) {
        return result.data as GameState;
      }
      if (!result.success) {
        console.error('Failed to retrieve hot state:', result.error);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving hot state:', error);
      return null;
    }
  }

  /**
   * Archive bout log.
   * @param year -
   * @param season -
   * @param boutId -
   * @param logData -
   * @param _overwrite -
   */
  async archiveBoutLog(
    year: number,
    season: number,
    boutId: string,
    logData: string[],
    _overwrite?: boolean
  ): Promise<void> {
    return this.enqueue(async () => {
      if (!this.isSupported() || !window.electronAPI) return;

      try {
        const result = await window.electronAPI.archiveBoutLog(year, season, boutId, logData);
        if (!result.success) {
          console.error('Failed to archive bout log:', result.error);
        }
      } catch (error) {
        console.error('Error archiving bout log:', error);
      }
    });
  }

  /**
   * Retrieve bout log.
   */
  async retrieveBoutLog(year: number, season: number, boutId: string): Promise<string[] | null> {
    if (!this.isSupported() || !window.electronAPI) return null;

    try {
      const result = await window.electronAPI.retrieveBoutLog(year, season, boutId);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving bout log:', error);
      return null;
    }
  }

  /**
   * Get archived bout ids for season.
   */
  async getArchivedBoutIdsForSeason(_season: number): Promise<string[]> {
    // This would require additional IPC handler to list bout IDs in a season
    // For now, return empty array as this is not critical for Electron version
    return [];
  }
} // ElectronArchiveService
