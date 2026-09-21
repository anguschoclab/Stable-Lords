import type { DeferredBoutLog, GameState } from '@/types/state.types';

/**
 * Detaches the pending deferred bout logs from state and clears the queue.
 * Mutates `state.deferredBoutLogs` in place — safe because `advanceWeek`
 * returns a freshly cloned state each tick.
 *
 * Environment-agnostic counterpart to `flushDeferredArchivesOffThread`:
 * it only extracts the logs; the caller decides how to persist them
 * (OPFS worker in the app, fs in Node scripts, or drop in tests).
 */
export function drainDeferredBoutLogs(state: GameState): DeferredBoutLog[] {
  const logs = state.deferredBoutLogs ?? [];
  if (logs.length === 0) return logs;
  state.deferredBoutLogs = [];
  return logs;
}
