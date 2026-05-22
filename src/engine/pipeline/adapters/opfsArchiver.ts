import type { GameState } from '@/types/state.types';
import { type Season } from '@/types/shared.types';
import { OPFSArchiveService } from '@/engine/storage/opfsArchive';
import { archiveWorkerProxy } from '@/engine/storage/archiveWorkerProxy';

const SEASONS: Season[] = ['Spring', 'Summer', 'Fall', 'Winter'];/**
 * Season to number.
 * @param season - Season.
 * @returns The result.
 */

/**
 * Season to number.
 * @param season - Season.
 * @returns The result.
 */
export function seasonToNumber(season: Season): number {
  return SEASONS.indexOf(season);
}

/**
 * Flush all deferred bout logs to OPFS
 * Call this at the end of batch operations (quarter/year)
 */
export async function flushDeferredArchives(state: GameState): Promise<GameState> {
  const opfs = new OPFSArchiveService();
  if (!opfs.isSupported()) return state;

  const deferred = state.deferredBoutLogs;

  if (!deferred || deferred.length === 0) return state;

  // Archive all deferred logs
  const promises = deferred.map((log) =>
    opfs.archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true).catch((err) => {
      console.error(`Failed to archive bout ${log.boutId}:`, err);
    })
  );

  await Promise.all(promises);

  // Clear deferred logs
  state.deferredBoutLogs = [];

  return state;
}

/**
 * Non-blocking flush: extracts deferred bout logs from state, clears them
 * immediately on the main thread, and dispatches archiving to a Web Worker.
 * Returns the mutated state with deferredBoutLogs cleared.
 */
export function flushDeferredArchivesOffThread(state: GameState): GameState {
  const logs = state.deferredBoutLogs;
  if (!logs || logs.length === 0) return state;
  state.deferredBoutLogs = [];
  archiveWorkerProxy.flushLogs(logs).catch((err) => {
    console.error('Archive worker proxy: flush failed', err);
  });
  return state;
}/**
 * Archive week logs.
 * @param state - State.
 * @returns The result.
 */


/**
 * Archive week logs.
 * @param state - State.
 * @returns The result.
 */
export function archiveWeekLogs(state: GameState): GameState {
  const opfs = new OPFSArchiveService();
  if (!opfs.isSupported()) return state;

  let stateModified = false;
  const newArenaHistory = state.arenaHistory.map((summary) => {
    if (summary.transcript && summary.transcript.length > 0) {
      stateModified = true;
      const seasonNum = seasonToNumber(state.season);
      opfs
        .archiveBoutLog(state.year, seasonNum, summary.id, summary.transcript, true)
        .catch((err) => {
          console.error(`Failed to background archive bout ${summary.id}:`, err);
        });
      return { ...summary, transcript: undefined };
    }
    return summary;
  });

  if (!stateModified) return state;
  return { ...state, arenaHistory: newArenaHistory };
}
