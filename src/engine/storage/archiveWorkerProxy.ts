import * as Comlink from 'comlink';
import type { ArchiveWorker } from './archiveWorker';
import type { DeferredBoutLog } from '@/types/state.types';

type AsyncArchiveWorker = {
  flushLogs(logs: DeferredBoutLog[]): Promise<void>;
};

let proxy: AsyncArchiveWorker | null = null;

function buildProxy(): AsyncArchiveWorker {
  const worker = new Worker(new URL('./archiveWorker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<ArchiveWorker>(worker) as unknown as AsyncArchiveWorker;
}

/**
 * Lazily wraps the archive worker. Deferred so importing this module inside
 * the engine worker (or tests) does not eagerly spawn a nested Worker.
 */
export const archiveWorkerProxy: AsyncArchiveWorker = {
  flushLogs(logs) {
    if (!proxy) proxy = buildProxy();
    return proxy.flushLogs(logs);
  },
};
