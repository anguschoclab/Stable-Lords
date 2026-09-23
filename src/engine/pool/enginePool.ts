import * as Comlink from 'comlink';
import {
  runRivalShardChunk,
  type RivalShardContext,
  type RivalShardInput,
  type RivalShardOutput,
} from '@/engine/pipeline/passes/rivalStableShard';
import { telemetry, TelemetryEvents } from '@/engine/telemetry';
import type { GameState } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import type { BoutContext, BoutImpact } from '@/engine/bout/services/boutProcessorTypes';
import { resolveBout } from '@/engine/bout/services/boutResolution';
import type { BoutPairing } from '@/engine/bout/core/pairings';
import type { getMoodModifiers } from '@/engine/crowdMood';
import { collectBoutEvents, type BoutShardOutput } from '@/engine/pool/shardTypes';

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
export function processBoutShard(input: BoutShardInput, ctx: BoutShardContext): BoutImpact {
  const p = input.pairing;
  const contract = p.contractId
    ? ctx.state.boutOffers?.[p.contractId as BoutOfferId]
    : undefined;
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
  mapRivalShards(
    inputs: RivalShardInput[],
    ctx: RivalShardContext
  ): Promise<RivalShardOutput[]>;
  mapBoutShards(inputs: BoutShardInput[], ctx: BoutShardContext): Promise<BoutShardOutput[]>;
  terminate(): void;
}

/** Pool construction options. */
export interface EnginePoolOptions {
  /**
   * Worker spawn seam — tests inject a factory returning a shard API that runs
   * the real functions asynchronously in-process (MockWorker cannot execute
   * module workers). Defaults to a real module Worker + Comlink.
   */
  spawnShardWorker?: () => ShardWorkerApi;
}

function defaultSpawnShardWorker(): ShardWorkerApi {
  const worker = new Worker(new URL('./shardWorker.ts', import.meta.url), { type: 'module' });
  return Comlink.wrap<ShardWorkerApi>(worker) as unknown as ShardWorkerApi;
}

/**
 * Creates an engine pool. `size <= 1` (or absent Worker support) yields the
 * in-line implementation: same shard functions, zero transport cost. The
 * distributed path preserves input order by concatenating contiguous chunks.
 */
export function createEnginePool(size = 1, opts?: EnginePoolOptions): EnginePool {
  const workers: ShardWorkerApi[] = [];
  let terminated = false;
  const spawn = opts?.spawnShardWorker ?? defaultSpawnShardWorker;
  const canSpawn = size > 1 && typeof Worker !== 'undefined';

  let spawnFailed = false;
  function getWorker(i: number): ShardWorkerApi | null {
    if (spawnFailed) return null;
    try {
      if (!workers[i]) workers[i] = spawn();
      return workers[i];
    } catch {
      // Worker spawn can fail in environments that expose `Worker` but can't
      // load module workers (some Electron/embedded contexts) — degrade to
      // the in-line path rather than failing the week.
      spawnFailed = true;
      return null;
    }
  }

  async function distributed<I, C, O>(
    inputs: I[],
    ctx: C,
    run: (w: ShardWorkerApi, inputs: I[], ctx: C) => Promise<O[]>,
    fallback: (inputs: I[], ctx: C) => O[]
  ): Promise<O[]> {
    const n = Math.min(size, inputs.length);
    const chunks = chunk(inputs, n);
    const started = performance.now();
    const jobs = chunks.map((c, i) => {
      const w = getWorker(i);
      return w ? run(w, c, ctx) : Promise.resolve(fallback(c, ctx));
    });
    const results = await Promise.all(jobs);
    telemetry.timing(TelemetryEvents.PARALLEL_SHARD_MS, performance.now() - started, {
      shards: String(chunks.length),
    });
    return results.flat();
  }

  return {
    size: canSpawn ? size : 1,

    async mapRivalShards(inputs, ctx) {
      if (!canSpawn || inputs.length <= 1 || terminated) {
        return runRivalShardChunk(inputs, ctx);
      }
      return distributed(inputs, ctx, (w, c, x) => w.runRivalShardChunk(c, x), (c, x) =>
        runRivalShardChunk(c, x)
      );
    },

    async mapBoutShards(inputs, ctx) {
      if (!canSpawn || inputs.length <= 1 || terminated) {
        return runBoutShardChunk(inputs, ctx);
      }
      return distributed(inputs, ctx, (w, c, x) => w.runBoutShardChunk(c, x), (c, x) =>
        runBoutShardChunk(c, x)
      );
    },

    terminate() {
      terminated = true;
      workers.length = 0;
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
