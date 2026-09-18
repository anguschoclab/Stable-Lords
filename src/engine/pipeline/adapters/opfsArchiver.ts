import type { GameState } from '@/types/state.types';
import { archiveService } from '@/engine/storage/archiveService';
import { archiveWorkerProxy } from '@/engine/storage/archiveWorkerProxy';

/**
 * Non-blocking flush: extracts deferred bout logs from state, clears them
 * immediately on the main thread, and dispatches archiving.
 *
 * Every write goes through the Electron/web `archiveService` switch — never
 * a hard-coded backend — so persistence lands in the same place as saves.
 * In Electron the service writes via IPC; on the web the work goes to a Web
 * Worker, and a worker failure retries directly on the main thread rather
 * than dropping the logs (the transcripts are already detached). A log whose
 * write still fails is pushed back onto `state.deferredBoutLogs` so the next
 * week's flush retries it instead of losing the transcript.
 *
 * Returns the mutated state with deferredBoutLogs cleared.
 */
export function flushDeferredArchivesOffThread(state: GameState): GameState {
  const logs = state.deferredBoutLogs;
  if (!logs || logs.length === 0) return state;
  state.deferredBoutLogs = [];

  const archiveDirectly = () =>
    Promise.all(
      logs.map((log) =>
        archiveService
          .archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true)
          .then(
            () => null,
            (err) => {
              console.error(`Failed to archive bout ${log.boutId}:`, err);
              return log;
            }
          )
      )
    ).then((results) => {
      const failed = results.filter((log): log is NonNullable<typeof log> => log !== null);
      if (failed.length > 0) state.deferredBoutLogs.push(...failed);
    });

  if (typeof window !== 'undefined' && window.electronAPI) {
    void archiveDirectly();
    return state;
  }

  archiveWorkerProxy.flushLogs(logs).catch((err) => {
    console.error('Archive worker proxy: flush failed — retrying on the main thread', err);
    void archiveDirectly();
  });
  return state;
}
