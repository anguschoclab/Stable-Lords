import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';
import type { GameState } from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';
import type { ShardSyncStage } from '@/engine/pool/syncedShardState';
import type { SyncedShardWorkerApi, WeekSyncLedger } from '@/engine/pool/enginePool';

/**
 * V15 — coordinator-side sync bookkeeping for the engine pool.
 *
 * Tracks each worker's position on the stage chain
 * (none → input → weekStart → postCore → weekResult) and replays whatever
 * transitions it needs at dispatch time. Each step's receipt hash is
 * compared against the coordinator's own stage-state hash; a mismatch
 * heals by sending the full stage state once, and a worker that still
 * can't match is marked broken — its chunks run in-line instead.
 */

export type SyncTarget = 'weekStart' | 'postCore' | 'weekResult';

interface WorkerSyncState {
  stage: ShardSyncStage | 'none';
  /** absoluteWeek of the synced input replica the worker holds. */
  inputWeek?: number;
  /** True when `synced` is this week's pristine input (weekResult can replay finalize). */
  pristineInput: boolean;
  /** True after a hash mismatch/heal failure — chunk dispatch falls back in-line. */
  broken: boolean;
}

export interface SyncCoordinator {
  /** The active week's ledger — null between weeks. */
  ledger?: WeekSyncLedger;
  ensure(i: number, target: SyncTarget, spawnIfMissing?: boolean): Promise<void>;
  ensureAll(target: SyncTarget, spawnIfMissing?: boolean): Promise<void>;
  /** New-week rollover: weekResult workers roll forward to 'input', others resync. */
  installLedger(l: WeekSyncLedger): void;
  isBroken(i: number): boolean;
  reset(): void;
}

const STAGE_ORD: Record<WorkerSyncState['stage'], number> = {
  none: 0,
  input: 1,
  weekStart: 2,
  postCore: 3,
  weekResult: 4,
};

interface CoordCtx {
  ledger?: WeekSyncLedger;
  wstate: (WorkerSyncState | undefined)[];
  stageHashes: Partial<Record<SyncTarget, string>>;
  getWorker: (i: number) => SyncedShardWorkerApi | null;
  peekWorker: (i: number) => SyncedShardWorkerApi | undefined;
}

/**
 * Expected stage-state hash — read from the ledger's EAGER capture, never
 * re-computed: the ledger's state fields are live aliases that the pipeline
 * keeps mutating past the stage boundary, so a late hash would pollute.
 */
function coordHash(ctx: CoordCtx, stage: SyncTarget): string {
  const cached = ctx.stageHashes[stage];
  if (cached) return cached;
  const ledger = ctx.ledger;
  const h =
    stage === 'weekStart'
      ? ledger?.weekStartHash
      : stage === 'postCore'
        ? ledger?.postCoreHash
        : ledger?.resultHash;
  if (!h) throw new Error(`shard sync: ledger missing ${stage} hash`);
  ctx.stageHashes[stage] = h;
  return h;
}

async function heal(
  ctx: CoordCtx,
  w: SyncedShardWorkerApi,
  stage: SyncTarget,
  state: GameState | undefined
): Promise<string> {
  if (!state) throw new Error(`shard sync: no ${stage} state to heal from`);
  const h = await w.forceShardState(state, stage);
  if (h !== coordHash(ctx, stage)) throw new Error(`shard sync: ${stage} heal failed`);
  return h;
}

/**
 * weekStart: replay sweep→gazette→caches only when the worker holds THIS
 * week's pristine input replica (rolled forward from last week's result).
 * Anything else — fresh spawn, stale replica, mid-week heal — installs the
 * stage state directly; one transport beats a wasted replay + heal.
 */
async function stepWeekStart(
  ctx: CoordCtx,
  w: SyncedShardWorkerApi,
  ws: WorkerSyncState
): Promise<void> {
  const ledger = ctx.ledger as WeekSyncLedger;
  if (ws.stage !== 'input' || !ws.pristineInput || ws.inputWeek !== ledger.inputWeek) {
    await heal(ctx, w, 'weekStart', ledger.weekStartState);
    ws.stage = 'weekStart';
    ws.pristineInput = false;
    return;
  }
  const h = await w.advanceShardTo('weekStart', { headless: ledger.headless });
  if (h !== coordHash(ctx, 'weekStart')) {
    await heal(ctx, w, 'weekStart', ledger.weekStartState);
  }
  ws.stage = 'weekStart';
}

/**
 * postCore: replay bout+core impacts onto the worker's weekStart working
 * copy; without that base, install the stage state directly.
 */
async function stepPostCore(
  ctx: CoordCtx,
  w: SyncedShardWorkerApi,
  ws: WorkerSyncState
): Promise<void> {
  const ledger = ctx.ledger as WeekSyncLedger;
  if (ws.stage !== 'weekStart') {
    await heal(ctx, w, 'postCore', ledger.postCoreState);
    ws.stage = 'postCore';
    return;
  }
  const h = await w.advanceShardTo('postCore', {
    boutImpact: ledger.boutImpact as StateImpact,
    lastWeekBoutDisplay: ledger.lastWeekBoutDisplay,
    coreImpacts: ledger.coreImpacts ?? [],
  });
  if (h !== coordHash(ctx, 'postCore')) {
    await heal(ctx, w, 'postCore', ledger.postCoreState);
  }
  ws.stage = 'postCore';
}

/**
 * weekResult: replay world+content impacts + finalizeState only when the
 * worker holds both the postCore working copy AND this week's pristine
 * input (finalize reads oldState). Otherwise install the result — which is
 * also next week's input replica, so the transport pays once ever.
 */
async function stepWeekResult(
  ctx: CoordCtx,
  w: SyncedShardWorkerApi,
  ws: WorkerSyncState
): Promise<void> {
  const ledger = ctx.ledger as WeekSyncLedger;
  let h: string;
  if (ws.stage === 'postCore' && ws.pristineInput && ws.inputWeek === ledger.inputWeek) {
    const wc = ledger.weekContext;
    if (!wc) throw new Error('shard sync: ledger missing weekContext');
    h = await w.advanceShardTo('weekResult', {
      worldImpacts: ledger.stageImpacts.world ?? [],
      contentImpacts: ledger.stageImpacts.content ?? [],
      currentWeek: wc.currentWeek,
      nextWeek: wc.nextWeek,
      nextYear: wc.nextYear,
      headless: ledger.headless,
    });
  } else {
    h = await heal(ctx, w, 'weekResult', ledger.result);
  }
  if (h !== coordHash(ctx, 'weekResult')) {
    await heal(ctx, w, 'weekResult', ledger.result);
  }
  ws.stage = 'weekResult';
  ws.inputWeek = ledger.result?.absoluteWeek;
  ws.pristineInput = true;
}

async function ensureStage(
  ctx: CoordCtx,
  i: number,
  target: SyncTarget,
  spawnIfMissing: boolean
): Promise<void> {
  const w = spawnIfMissing ? ctx.getWorker(i) : (ctx.peekWorker(i) ?? null);
  if (!w || !ctx.ledger) return;
  const ws = (ctx.wstate[i] ??= { stage: 'none', pristineInput: false, broken: false });
  if (ws.broken) return;
  const chain: [SyncTarget, (c: CoordCtx, w: SyncedShardWorkerApi, s: WorkerSyncState) => Promise<void>][] =
    target === 'weekStart'
      ? [['weekStart', stepWeekStart]]
      : target === 'postCore'
        ? [['weekStart', stepWeekStart], ['postCore', stepPostCore]]
        : [['weekStart', stepWeekStart], ['postCore', stepPostCore], ['weekResult', stepWeekResult]];
  try {
    for (const [step, run] of chain) {
      if (STAGE_ORD[ws.stage] >= STAGE_ORD[step]) continue;
      await run(ctx, w, ws);
    }
  } catch (err) {
    ws.broken = true;
    telemetry.timing(TelemetryEvents.PARALLEL_SHARD_MS, 0, {
      shards: 'sync-broken',
      reason: String(err),
    });
  }
}

export function createSyncCoordinator(
  size: number,
  getWorker: (i: number) => SyncedShardWorkerApi | null,
  peekWorker: (i: number) => SyncedShardWorkerApi | undefined
): SyncCoordinator {
  const ctx: CoordCtx = { wstate: [], stageHashes: {}, getWorker, peekWorker };
  return {
    get ledger() {
      return ctx.ledger;
    },
    set ledger(l: WeekSyncLedger | undefined) {
      ctx.ledger = l;
    },
    ensure: (i, target, spawnIfMissing = true) =>
      ensureStage(ctx, i, target, spawnIfMissing),
    ensureAll: async (target, spawnIfMissing = true) => {
      // Workers are independent — transitions can be replayed in parallel.
      await Promise.all(
        Array.from({ length: size }, (_, i) => ensureStage(ctx, i, target, spawnIfMissing))
      );
    },
    installLedger(l) {
      ctx.ledger = l;
      for (const k of Object.keys(ctx.stageHashes) as SyncTarget[]) {
        ctx.stageHashes[k] = undefined;
      }
      for (const ws of ctx.wstate) {
        if (!ws) continue;
        if (ws.stage === 'weekResult') {
          // The replayed result IS this week's input replica — roll forward.
          ws.stage = 'input';
        } else {
          // Mid-week bootstraps don't hold the new input — resync.
          ws.stage = 'none';
          ws.pristineInput = false;
          ws.inputWeek = undefined;
        }
      }
    },
    isBroken: (i) => ctx.wstate[i]?.broken ?? false,
    reset() {
      ctx.wstate.length = 0;
      ctx.ledger = undefined;
    },
  };
}
