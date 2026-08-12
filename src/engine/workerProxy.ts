import * as Comlink from 'comlink';
import type { EngineWorker } from './worker';

type AsyncEngine = {
  [K in keyof EngineWorker]: (
    ...args: Parameters<EngineWorker[K]>
  ) => ReturnType<EngineWorker[K]> extends Promise<infer T>
    ? Promise<T>
    : Promise<ReturnType<EngineWorker[K]>>;
};

function buildProxy(): AsyncEngine {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<EngineWorker>(worker) as unknown as AsyncEngine;
}

export const engineProxy = buildProxy();
