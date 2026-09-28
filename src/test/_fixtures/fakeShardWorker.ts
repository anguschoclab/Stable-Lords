import { runRivalShardChunk } from '@/engine/pipeline/passes/rivalStableShard';
import { runBoutShardChunk } from '@/engine/pool/enginePool';
import type { ShardWorkerApi } from '@/engine/pool/enginePool';

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
