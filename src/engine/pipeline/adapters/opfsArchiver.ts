import type { DeferredBoutLog, GameState } from '@/types/state.types';
import { archiveService } from '@/engine/storage/archiveService';
import { archiveWorkerProxy } from '@/engine/storage/archiveWorkerProxy';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';

/**
 * Non-blocking flush: extracts deferred bout logs from state, clears them
 * immediately, and dispatches archiving.
 *
 * Every write goes through the Electron/web `archiveService` switch — never
 * a hard-coded backend — so persistence lands in the same place as saves.
 * In Electron the service writes via IPC; on the web the work goes to a Web
 * Worker, and a worker failure retries directly on the main thread rather
 * than dropping the logs (the transcripts are already detached).
 *
 * IMPORTANT (thread-safety): this module must only run on the main thread.
 * Callers inside the engine worker (batch advancement, autosim) never flush —
 * they surface logs via `deferredBoutLogs`/`pendingArchives` on their results
 * and let the main-thread caller flush. In a worker `window` is undefined,
 * so an in-worker flush would silently route to OPFS even under Electron.
 *
 * Failed writes are held in a module-level retry registry (not pushed back
 * onto the returned state's queue — that array can be detached by cloning
 * before the async write settles). The next flush re-attempts them.
 */
const pendingRetries: DeferredBoutLog[] = [];

/**
 * Subscribers notified when a write fails and the log is parked for retry.
 * The store subscribes so re-queued logs land on the CURRENT game state (the
 * ephemeral worker-state copy is long gone by the time a write settles).
 */
type ArchiveRetryListener = (log: DeferredBoutLog) => void;
const retryListeners = new Set<ArchiveRetryListener>();

export function onArchiveRetry(listener: ArchiveRetryListener): () => void {
  retryListeners.add(listener);
  return () => retryListeners.delete(listener);
}

function notifyRetry(log: DeferredBoutLog): void {
  for (const listener of retryListeners) {
    try {
      listener(log);
    } catch (err) {
      console.error('Archive retry listener threw:', err);
    }
  }
}

/** Test/diagnostic hook: logs awaiting retry after a failed flush. */
export function getPendingArchiveRetries(): readonly DeferredBoutLog[] {
  return pendingRetries;
}

function archiveDirectly(logs: DeferredBoutLog[]): Promise<void> {
  return Promise.all(
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
    for (const log of results) {
      if (log) {
        pendingRetries.push(log);
        notifyRetry(log);
      }
    }
  });
}

/**
 * Archive a set of bout logs off-thread (or via IPC in Electron). Failed
 * writes land in the retry registry and are re-attempted on the next call.
 */
export function archiveBoutLogs(logs: DeferredBoutLog[]): void {
  const batch = [...pendingRetries, ...logs];
  pendingRetries.length = 0;
  if (batch.length === 0) return;

  if (typeof window !== 'undefined' && window.electronAPI) {
    void archiveDirectly(batch);
    return;
  }

  archiveWorkerProxy.flushLogs(batch).catch((err) => {
    console.error('Archive worker proxy: flush failed — retrying on the main thread', err);
    void archiveDirectly(batch);
  });
}

/**
 * Drain `state.deferredBoutLogs` and dispatch them (plus any pending retries)
 * for archiving. Returns the state with the queue cleared.
 */
export function flushDeferredArchivesOffThread(state: GameState): GameState {
  archiveBoutLogs(drainDeferredBoutLogs(state));
  return state;
}
