import * as Comlink from 'comlink';
import {
  runRivalShardChunk,
  type RivalShardContext,
  type RivalShardInput,
  type RivalShardOutput,
} from '@/engine/pipeline/passes/rivalStableShard';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';
import type { GameState } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import type { BoutContext, BoutImpact } from '@/engine/bout/services/boutProcessorTypes';
import { resolveBout } from '@/engine/bout/services/boutResolution';
import type { BoutPairing } from '@/engine/bout/core/pairings';
import { tournamentIdFromContractId } from '@/engine/bout/core/pairings';
import type { getMoodModifiers } from '@/engine/bout/crowdMood';
import { collectBoutEvents, type BoutShardOutput } from '@/engine/pool/shardTypes';
import type { StateImpact } from '@/engine/impacts';
import type { ShardAdvancePayload, ShardSyncStage } from '@/engine/pool/syncedShardState';
import { createSyncCoordinator, type SyncCoordinator } from '@/engine/pool/syncCoordinator';
import { shardStateHash } from '@/engine/pool/stateHash';

/**
 * Stable Lords — Engine Pool
 *
 * Lazy pool of shard workers for embarrassingly-parallel pipeline stages
 * (per-rival strategy, per-bout resolution). The SAME shard functions run
 * in-line when size <= 1 or workers are unavailable, so distributed and
 * sequential output are byte-identical by construction.
 *
 * Workers are spawned on first use — never at module import — and the pool
 * is a per-context singleton (main thread AND the engine worker can each
 * own one; nested workers are legal in Chromium/Electron).
 */
export interface ShardWorkerApi {
  runRivalShardChunk: (
    inputs: RivalShardInput[],
    ctx: RivalShardContext
  ) => Promise<RivalShardOutput[]>;
  runBoutShardChunk: (
    inputs: BoutShardInput[],
    ctx: BoutShardContext
  ) => Promise<BoutShardOutput[]>;
}

/**
 * V15 — synced shard worker: holds a persistent GameState replica. The
 * coordinator broadcasts stage transitions (boundary-fn inputs + impacts);
 * the worker replays the same deterministic functions and returns a state
 * hash per stage. Wire ctx drops every recomputable field — rival shards
 * receive {nextWeek}, bout shards {headless}.
 */
export interface SyncedShardWorkerApi extends ShardWorkerApi {
  /** Replay one stage transition; resolves to the worker's stage-state hash. */
  advanceShardTo(
    stage: 'weekStart' | 'postCore' | 'weekResult',
    payload: ShardAdvancePayload
  ): Promise<string>;
  /** Healing send: install `state` as the working/synced copy at `stage`. */
  forceShardState(state: GameState, stage: ShardSyncStage): Promise<string>;
  runSyncedBoutShardChunk(
    inputs: BoutShardInput[],
    opts: { headless?: boolean }
  ): Promise<BoutShardOutput[]>;
  runSyncedRivalShardChunk(
    inputs: RivalShardInput[],
    opts: { nextWeek: number }
  ): Promise<RivalShardOutput[]>;
}

/**
 * Coordinator-side record of one week's stage transitions — populated by
 * the pipeline as each stage completes. Synced workers replay the chain
 * lazily at shard-dispatch time, so the ledger must be complete through
 * the stage a map call needs.
 */
export interface WeekSyncLedger {
  /** advanceWeek's input version (its absoluteWeek) — the sync token. */
  inputWeek: number;
  headless?: boolean;
  /** mutableState after sweep + gazette + buildWeekCaches (bout-shard state).
   * Aliases the live pipeline object — exact only within its dispatch
   * window; trust `weekStartHash` for verification, never a late re-hash. */
  weekStartState?: GameState;
  /** shardStateHash of weekStartState, computed eagerly at capture. */
  weekStartHash?: string;
  /** Replicates runBoutPhase's tail on the worker. */
  boutImpact?: StateImpact;
  lastWeekBoutDisplay?: GameState['lastWeekBoutDisplay'];
  /** Replicates resolveImpacts(settledState, coreImpacts). */
  coreImpacts?: StateImpact[];
  /** stateAfterCore (rival-shard state). Same alias-window caveat. */
  postCoreState?: GameState;
  /** shardStateHash of postCoreState, computed eagerly at capture. */
  postCoreHash?: string;
  /** shardStateHash of the week result — set by finishWeek. */
  resultHash?: string;
  /** Per-stage impact arrays for endWeek replay. */
  stageImpacts: { world?: StateImpact[]; content?: StateImpact[] };
  /** Scalars for finalizeState replay. */
  weekContext?: { currentWeek: number; nextWeek: number; nextYear: number };
  /** advanceWeek's result — the next synced input. */
  result?: GameState;
}

/** One bout pairing dispatched to a shard. */
export interface BoutShardInput {
  pairing: BoutPairing;
}

/** Read-only bout context shared by every shard in a week. */
export interface BoutShardContext {
  state: GameState;
  warriorMap: BoutContext['warriorMap'];
  moodMods: ReturnType<typeof getMoodModifiers>;
  headless?: boolean;
}

/**
 * Runs one bout pairing. Shared by the in-line path and shard workers so
 * distributed output is identical by construction.
 */
function processBoutShard(input: BoutShardInput, ctx: BoutShardContext): BoutImpact {
  const p = input.pairing;
  const contract = p.contractId ? ctx.state.boutOffers?.[p.contractId as BoutOfferId] : undefined;
  return resolveBout(ctx.state, {
    warrior: p.a,
    opponent: p.d,
    isRivalry: p.isRivalry,
    rivalStable: p.rivalStable,
    rivalStableId: p.rivalStableId,
    moodMods: ctx.moodMods,
    week: ctx.state.absoluteWeek,
    displayWeek: ctx.state.week,
    playerId: ctx.state.player.id,
    warriorMap: ctx.warriorMap,
    contract,
    headless: ctx.headless,
    isTournamentBout: p.contractId?.startsWith('tour_') ?? false,
    tournamentId: tournamentIdFromContractId(p.contractId),
  });
}

/**
 * Bout chunk executor — the semantic reference used by BOTH the in-line path
 * and shard workers. Engine-bus emissions are captured into each output so
 * the coordinator can re-emit them centrally in pairing order (distributed
 * emissions cannot cross the worker boundary on their own).
 */
export function runBoutShardChunk(
  inputs: BoutShardInput[],
  ctx: BoutShardContext
): BoutShardOutput[] {
  const { results, events } = collectBoutEvents(() =>
    inputs.map((input) => processBoutShard(input, ctx))
  );
  // Events are chunk-scoped, attached to the first output — the coordinator
  // emits outputs in order, so chunk events land in pairing order globally.
  return results.map((bout, i) => ({ bout, events: i === 0 ? events : [] }));
}

/** Splits `items` into `n` contiguous, order-preserving chunks. */
function chunk<T>(items: T[], n: number): T[][] {
  const size = Math.ceil(items.length / n);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Engine worker-pool contract — order-preserving shard maps for rival
 * strategy and bout resolution, plus explicit worker teardown.
 */
export interface EnginePool {
  readonly size: number;
  /** True when the pool runs the V15 persistent-state protocol (synced workers + week ledger). */
  readonly supportsSync: boolean;
  mapRivalShards(inputs: RivalShardInput[], ctx: RivalShardContext): Promise<RivalShardOutput[]>;
  mapBoutShards(inputs: BoutShardInput[], ctx: BoutShardContext): Promise<BoutShardOutput[]>;
  /** Install this week's transition ledger — the pipeline fills it in as stages complete. */
  setWeekLedger(ledger: WeekSyncLedger): void;
  /** Replay the week's tail on every synced worker (world+content impacts + finalizeState). */
  finishWeek(result: GameState): Promise<void>;
  terminate(): void;
}

/** Pool construction options. */
interface EnginePoolOptions {
  /**
   * Worker spawn seam — tests inject a factory returning a shard API that runs
   * the real functions asynchronously in-process (MockWorker cannot execute
   * module workers). Defaults to a real module Worker + Comlink.
   */
  spawnShardWorker?: () => ShardWorkerApi;
  /**
   * Workers implement SyncedShardWorkerApi — enable the V15 persistent
   * shard-state protocol. Defaults to true for the real shardWorker.ts.
   */
  syncedWorkers?: boolean;
}

function defaultSpawnShardWorker(): ShardWorkerApi {
  const worker = new Worker(new URL('./shardWorker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<ShardWorkerApi>(worker) as unknown as ShardWorkerApi;
}

interface PoolDispatch {
  canSpawn: boolean;
  synced: boolean;
  terminated: boolean;
  size: number;
  getWorker: (i: number) => ShardWorkerApi | null;
  sync: SyncCoordinator;
}

/** Order-preserving chunk dispatch: contiguous chunks, concatenated results. */
async function runShardJobs<I, O>(
  pool: PoolDispatch,
  inputs: I[],
  run: (i: number, chunk: I[]) => Promise<O[]> | O[]
): Promise<O[]> {
  const chunks = chunk(inputs, Math.min(pool.size, inputs.length));
  const started = performance.now();
  const results = await Promise.all(chunks.map((c, i) => run(i, c)));
  telemetry.timing(TelemetryEvents.PARALLEL_SHARD_MS, performance.now() - started, {
    shards: String(chunks.length),
  });
  return results.flat();
}

interface StageMapSpec<I, C, O> {
  target: 'weekStart' | 'postCore';
  /** True when the ledger has this stage's state — otherwise the legacy path runs. */
  ready: boolean;
  syncedRun: (w: SyncedShardWorkerApi, c: I[]) => Promise<O[]>;
  legacyRun: (w: ShardWorkerApi, c: I[], ctx: C) => Promise<O[]>;
  fallback: (c: I[], ctx: C) => O[];
}

/**
 * Shared map path: in-line when the pool can't take the work; stage-synced
 * when a ledger is installed; legacy per-chunk ctx transport otherwise.
 * Synced chunks whose worker is broken run in-line on the caller's ctx —
 * identical output, just not parallel.
 */
async function mapStageShards<I, C, O>(
  pool: PoolDispatch,
  inputs: I[],
  ctx: C,
  spec: StageMapSpec<I, C, O>
): Promise<O[]> {
  if (!pool.canSpawn || inputs.length <= 1 || pool.terminated) {
    return spec.fallback(inputs, ctx);
  }
  if (pool.synced && spec.ready) {
    // Fuse stage-sync with dispatch: each worker's ensure+chunk forms one
    // async chain so sync waits overlap chunk compute instead of serializing
    // behind a barrier.
    return runShardJobs(pool, inputs, async (i, c) => {
      await pool.sync.ensure(i, spec.target);
      const w = pool.getWorker(i) as SyncedShardWorkerApi | null;
      return w && !pool.sync.isBroken(i) ? spec.syncedRun(w, c) : spec.fallback(c, ctx);
    });
  }
  return runShardJobs(pool, inputs, (i, c) => {
    const w = pool.getWorker(i);
    return w ? spec.legacyRun(w, c, ctx) : spec.fallback(c, ctx);
  });
}

/**
 * Creates an engine pool. `size <= 1` (or absent Worker support) yields the
 * in-line implementation: same shard functions, zero transport cost. The
 * distributed path preserves input order by concatenating contiguous chunks.
 */
export function createEnginePool(size = 1, opts?: EnginePoolOptions): EnginePool {
  const workers: ShardWorkerApi[] = [];
  const spawn = opts?.spawnShardWorker ?? defaultSpawnShardWorker;
  let spawnFailed = false;
  function getWorker(i: number): ShardWorkerApi | null {
    if (spawnFailed) return null;
    try {
      return (workers[i] ??= spawn());
    } catch {
      // Spawn can fail where `Worker` exists but module workers can't load
      // (some Electron/embedded contexts) — degrade to the in-line path.
      spawnFailed = true;
      return null;
    }
  }
  const pool: PoolDispatch = {
    canSpawn: size > 1 && typeof Worker !== 'undefined',
    synced: opts?.syncedWorkers ?? opts?.spawnShardWorker === undefined,
    terminated: false,
    size,
    getWorker,
    sync: createSyncCoordinator(
      size,
      (i) => getWorker(i) as SyncedShardWorkerApi | null,
      (i) => workers[i] as SyncedShardWorkerApi | undefined
    ),
  };

  return {
    size: pool.canSpawn ? size : 1,
    supportsSync: pool.canSpawn && pool.synced,

    setWeekLedger(l) {
      pool.sync.installLedger(l);
    },

    async finishWeek(result) {
      if (!pool.canSpawn || !pool.synced || !pool.sync.ledger || pool.terminated) return;
      pool.sync.ledger.result = result;
      pool.sync.ledger.resultHash = shardStateHash(result);
      await pool.sync.ensureAll('weekResult', false);
    },

    mapRivalShards(inputs, ctx) {
      return mapStageShards(pool, inputs, ctx, {
        target: 'postCore',
        ready: !!pool.sync.ledger?.postCoreState,
        syncedRun: (w, c) => w.runSyncedRivalShardChunk(c, { nextWeek: ctx.nextWeek }),
        legacyRun: (w, c, x) => w.runRivalShardChunk(c, x),
        fallback: (c, x) => runRivalShardChunk(c, x),
      });
    },

    mapBoutShards(inputs, ctx) {
      return mapStageShards(pool, inputs, ctx, {
        target: 'weekStart',
        ready: !!pool.sync.ledger?.weekStartState,
        syncedRun: (w, c) => w.runSyncedBoutShardChunk(c, { headless: ctx.headless }),
        legacyRun: (w, c, x) => w.runBoutShardChunk(c, x),
        fallback: (c, x) => runBoutShardChunk(c, x),
      });
    },

    terminate() {
      pool.terminated = true;
      workers.length = 0;
      pool.sync.reset();
    },
  };
}

// ── Shared pool registry ─────────────────────────────────────────────────────

let sharedPoolSize = 1;
let sharedPool: EnginePool | null = null;

/**
 * Configures the process-wide engine pool size. `1` (default) keeps the
 * sequential in-line path; `>1` lazily spawns shard workers on first use.
 * Call `shutdownEnginePool()` after changing size to drop stale workers.
 */
export function configureEnginePool(size: number): void {
  sharedPoolSize = Math.max(1, Math.floor(size));
  sharedPool = null;
}

/** Returns the shared pool, creating it lazily at the configured size. */
export function getEnginePool(): EnginePool {
  if (!sharedPool) sharedPool = createEnginePool(sharedPoolSize);
  return sharedPool;
}

/** Terminates the shared pool's workers. */
export function shutdownEnginePool(): void {
  sharedPool?.terminate();
  sharedPool = null;
}
