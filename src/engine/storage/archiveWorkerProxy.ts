import * as Comlink from 'comlink';
import type { ArchiveWorker } from './archiveWorker';
import type { DeferredBoutLog } from '@/types/state.types';

type AsyncArchiveWorker = {
  flushLogs(logs: DeferredBoutLog[]): Promise<void>;
};

function buildProxy(): AsyncArchiveWorker {
  const worker = new Worker(new URL('./archiveWorker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<ArchiveWorker>(worker) as unknown as AsyncArchiveWorker;
}

export const archiveWorkerProxy = buildProxy();
