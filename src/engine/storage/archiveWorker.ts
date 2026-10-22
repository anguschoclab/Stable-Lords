import * as Comlink from 'comlink';
import { OPFSArchiveService } from './opfsArchive';
import type { DeferredBoutLog } from '@/types/state.types';

import { logger } from '@/utils/logger';

const archiveWorkerApi = {
  async flushLogs(logs: DeferredBoutLog[]): Promise<void> {
    const opfs = new OPFSArchiveService();
    if (!opfs.isSupported() || !logs.length) return;
    await Promise.all(
      logs.map((log) =>
        opfs
          .archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true)
          .catch((err) => logger.error(`Archive worker: failed to archive ${log.boutId}`, err))
      )
    );
  },
};

Comlink.expose(archiveWorkerApi);

/**
 * Archive worker type.
 */
export type ArchiveWorker = typeof archiveWorkerApi;
