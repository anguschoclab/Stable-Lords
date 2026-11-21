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
import {
  createSyncedShardStore,
  advanceShardTo,
  forceShardState,
  runSyncedBoutShardChunk,
  runSyncedRivalShardChunk,
  type ShardAdvancePayload,
  type ShardSyncStage,
} from '@/engine/pool/syncedShardState';
import type { GameState } from '@/types/state.types';

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
 *
 * V15: holds a synced GameState replica (`syncStore`). The coordinator
 * broadcasts stage transitions; the worker replays the same boundary
 * functions and reports a state hash per stage for drift detection.
 */
const syncStore = createSyncedShardStore();

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

  // ── V15 synced path ─────────────────────────────────────────────────
  async advanceShardTo(
    stage: 'weekStart' | 'postCore' | 'weekResult',
    payload: ShardAdvancePayload
  ): Promise<string> {
    await narrativeReady;
    return advanceShardTo(syncStore, stage, payload);
  },
  async forceShardState(state: GameState, stage: ShardSyncStage): Promise<string> {
    await narrativeReady;
    return forceShardState(syncStore, state, stage);
  },
  async runSyncedBoutShardChunk(
    inputs: BoutShardInput[],
    opts: { headless?: boolean }
  ): Promise<BoutShardOutput[]> {
    await narrativeReady;
    return runSyncedBoutShardChunk(syncStore, inputs, opts);
  },
  async runSyncedRivalShardChunk(inputs: RivalShardInput[], opts: { nextWeek: number }) {
    return runSyncedRivalShardChunk(syncStore, inputs, opts);
  },
};

/** The API surface exposed to the pool over Comlink. */
Comlink.expose(shardApi);
