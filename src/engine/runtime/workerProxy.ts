import * as Comlink from 'comlink';
import type { EngineWorker } from './worker';

type AsyncEngine = {
  [K in keyof EngineWorker]: (
    ...args: Parameters<EngineWorker[K]>
  ) => ReturnType<EngineWorker[K]> extends Promise<infer T>
    ? Promise<T>
    : Promise<ReturnType<EngineWorker[K]>>;
};

let proxy: AsyncEngine | null = null;

function buildProxy(): AsyncEngine {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<EngineWorker>(worker) as unknown as AsyncEngine;
}

/**
 * Lazily wraps the engine worker. The Worker is spawned on first method call —
 * not at module import — so importing modules that transitively pull this in
 * (tests, Node harnesses, nested contexts) never spawns a worker eagerly.
 */
export const engineProxy: AsyncEngine = new Proxy({} as AsyncEngine, {
  get(_target, prop: keyof EngineWorker) {
    if (!proxy) proxy = buildProxy();
    return proxy[prop];
  },
});
