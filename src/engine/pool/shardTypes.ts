import type { BoutImpact } from '@/engine/bout/services/boutProcessorTypes';
import { engineEventBus, type EngineEvent } from '@/engine/core/EventBus';

/**
 * A resolved bout shard plus the engine events captured during resolution.
 * Events can't cross a worker boundary via the module-level singleton, so
 * shard workers collect them and the coordinator re-emits in pairing order.
 */
export interface BoutShardOutput {
  bout: BoutImpact;
  events: EngineEvent[];
}

/**
 * Runs `fn` while capturing every `engineEventBus.emit` into a buffer.
 * Emissions are suppressed during collection — the caller owns re-emission.
 */
export function collectBoutEvents<T>(fn: () => T): { results: T; events: EngineEvent[] } {
  const events: EngineEvent[] = [];
  const release = engineEventBus.capture(events);
  try {
    return { results: fn(), events };
  } finally {
    release();
  }
}
