import * as Comlink from 'comlink';
import { OPFSArchiveService } from './opfsArchive';
import type { DeferredBoutLog } from '@/types/state.types';

const archiveWorkerApi = {
  async flushLogs(logs: DeferredBoutLog[]): Promise<void> {
    const opfs = new OPFSArchiveService();
    if (!opfs.isSupported() || !logs.length) return;
    await Promise.all(
      logs.map((log) =>
        opfs
          .archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true)
          .catch((err) => console.error(`Archive worker: failed to archive ${log.boutId}`, err))
      )
    );
  },
};

Comlink.expose(archiveWorkerApi);/**
                                  * Archive worker type.
                                  */

/**
 * Archive worker type.
 */
export type ArchiveWorker = typeof archiveWorkerApi;
