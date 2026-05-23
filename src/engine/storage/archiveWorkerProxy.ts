import * as Comlink from 'comlink';
import type { ArchiveWorker } from './archiveWorker';
import type { DeferredBoutLog } from '@/types/state.types';

type AsyncArchiveWorker = {
  flushLogs(logs: DeferredBoutLog[]): Promise<void>;
};

/**
 * Stable Lords — Archive Worker Proxy
 * In production: offloads OPFS archive flush to a Web Worker via Comlink.
 * In development: runs the flush function directly on the main thread to avoid
 * the react-refresh/window crash injected by Vite's SWC plugin into workers.
 */
function buildProxy(): AsyncArchiveWorker {
  if (import.meta.env.DEV) {
    let cached: AsyncArchiveWorker | null = null;
    const load = async (): Promise<AsyncArchiveWorker> => {
      if (cached) return cached;
      const { OPFSArchiveService } = await import('./opfsArchive');
      cached = {
        async flushLogs(logs: DeferredBoutLog[]): Promise<void> {
          const opfs = new OPFSArchiveService();
          if (!opfs.isSupported() || !logs.length) return;
          await Promise.all(
            logs.map((log) =>
              opfs
                .archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true)
                .catch((err) =>
                  console.error(`Archive proxy (dev): failed to archive ${log.boutId}`, err)
                )
            )
          );
        },
      };
      return cached;
    };
    return {
      flushLogs: async (logs) => (await load()).flushLogs(logs),
    };
  }

  const worker = new Worker(new URL('./archiveWorker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<ArchiveWorker>(worker) as unknown as AsyncArchiveWorker;
}/**
  * Archive worker proxy.
  */


/**
 * Archive worker proxy.
 */
export const archiveWorkerProxy = buildProxy();
