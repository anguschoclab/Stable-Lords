import * as Comlink from 'comlink';
import { loadCombatNarrative } from '@/data/narrative';
import {
  runRivalShardChunk,
  type RivalShardContext,
  type RivalShardInput,
} from '@/engine/pipeline/passes/rivalStableShard';
import {
  runBoutShardChunk,
  type BoutShardContext,
  type BoutShardInput,
} from '@/engine/pool/enginePool';
import type { BoutShardOutput } from '@/engine/pool/shardTypes';

// Fire-and-forget: combat data must be loaded inside THIS worker before the
// first bout shard resolves (each worker has its own module-level cache).
const narrativeReady = loadCombatNarrative();

/**
 * Stable Lords — Shard Worker
 *
 * Runs pure pipeline shards (per-rival strategy, per-bout resolution) shipped
 * from the engine pool. Determinism is guaranteed by the shard functions
 * themselves — every random draw derives from absoluteWeek + index + ids, so
 * output does not depend on which worker executes a shard.
 */
const shardApi = {
  async runRivalShardChunk(inputs: RivalShardInput[], ctx: RivalShardContext) {
    return runRivalShardChunk(inputs, ctx);
  },
  async runBoutShardChunk(
    inputs: BoutShardInput[],
    ctx: BoutShardContext
  ): Promise<BoutShardOutput[]> {
    await narrativeReady;
    // runBoutShardChunk captures engine-bus emissions into each output —
    // they can't cross the worker boundary via the module-level singleton,
    // so the coordinator re-emits them in pairing order.
    return runBoutShardChunk(inputs, ctx);
  },
};

/** The API surface exposed to the pool over Comlink. */
export type ShardWorkerApi = typeof shardApi;

Comlink.expose(shardApi);
