import { runRivalShardChunk } from '@/engine/pipeline/passes/rivalStableShard';
import { runBoutShardChunk } from '@/engine/pool/enginePool';
import type { ShardWorkerApi, SyncedShardWorkerApi } from '@/engine/pool/enginePool';
import {
  createSyncedShardStore,
  advanceShardTo,
  forceShardState,
  runSyncedBoutShardChunk,
  runSyncedRivalShardChunk,
} from '@/engine/pool/syncedShardState';
import type { GameState } from '@/types/state.types';
import type { ShardAdvancePayload, ShardSyncStage } from '@/engine/pool/syncedShardState';

/**
 * In-process shard worker: runs the real chunk functions on structured
 * clones, exactly reproducing the postMessage serialization boundary —
 * shared references are broken and non-serializable payloads would throw.
 */
export function fakeShardWorker(): ShardWorkerApi {
  return {
    runRivalShardChunk: async (inputs, ctx) =>
      runRivalShardChunk(structuredClone(inputs), structuredClone(ctx)),
    runBoutShardChunk: async (inputs, ctx) =>
      runBoutShardChunk(structuredClone(inputs), structuredClone(ctx)),
  };
}

/**
 * In-process SYNCED shard worker (V15): wraps the real syncedShardState
 * store — the exact code the module worker runs — behind clone boundaries
 * so payloads must serialize and coordinator objects stay untouchable.
 */
export function fakeSyncedShardWorker(): SyncedShardWorkerApi {
  const store = createSyncedShardStore();
  return {
    runRivalShardChunk: async (inputs, ctx) =>
      runRivalShardChunk(structuredClone(inputs), structuredClone(ctx)),
    runBoutShardChunk: async (inputs, ctx) =>
      runBoutShardChunk(structuredClone(inputs), structuredClone(ctx)),
    advanceShardTo: async (stage: 'weekStart' | 'postCore' | 'weekResult', payload: ShardAdvancePayload) =>
      advanceShardTo(store, stage, structuredClone(payload)),
    forceShardState: async (state: GameState, stage: ShardSyncStage) =>
      forceShardState(store, structuredClone(state), stage),
    runSyncedBoutShardChunk: async (inputs, opts) =>
      runSyncedBoutShardChunk(store, structuredClone(inputs), opts),
    runSyncedRivalShardChunk: async (inputs, opts) =>
      runSyncedRivalShardChunk(store, structuredClone(inputs), opts),
  };
}
