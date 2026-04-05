import * as Comlink from "comlink";
import type { EngineWorker } from "./worker";

/**
 * Stable Lords — Engine Worker Proxy
 * Manages the connection to the simulation worker.
 */

// Create the worker instance using Vite's worker support
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

// Wrap the worker with Comlink
export const engineProxy = Comlink.wrap<EngineWorker>(worker);
