import type { GameState } from '@/types/state.types';
import { resolveImpacts, type StateImpact } from '@/engine/impacts';
import { getEnginePool, type EnginePool, type WeekSyncLedger } from '@/engine/pool/enginePool';
import { shardStateHash } from '@/engine/pool/stateHash';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import {
  prepareWeekContext,
  createMutableWeekContext,
  type WeekContext,
} from './weekPipeline/context';
import { assertPipelineLegal } from './weekPipeline/passes';
import { buildWeekCaches, impactsAffectWeekCaches } from './weekPipeline/caches';
import { runStage, runBoutPhase, collectCoreImpacts } from './weekPipeline/stages';
import { checkBankruptcy, finalizeState } from './weekPipeline/finalize';
import { flushGazette } from '@/engine/narrative/gazette';

/**
 * Options for week advancement
 */
export interface WeekAdvanceOptions {
  /** Skip UI-facing content generation (newsletters, gazettes) for headless mode */
  headless?: boolean;
  /**
   * Player is bankrupt or has an empty roster this week. World passes still run;
   * only player-facing content passes (events, narrative) are skipped. Internal —
   * set by advanceWeek, not by callers.
   */
  playerStopped?: boolean;
  /**
   * Caller grants ownership of `state` — the pipeline mutates it in place
   * instead of structuredClone-ing. Only legal when the caller exclusively
   * owns the object (e.g. postMessage-delivered worker input, or a state the
   * service itself produced). In-process callers must leave this unset.
   */
  mutableInput?: boolean;
  /**
   * Explicit engine pool for shard-parallel passes. When omitted, the shared
   * pool is used only if it was configured with size > 1 via
   * `configureEnginePool`; otherwise every pass runs in-line.
   */
  pool?: EnginePool;
}

export { isPipelineProfiling } from './weekPipeline/profiling';
export { WEEK_PIPELINE_PASSES } from './weekPipeline/passes';
export { buildWeekCaches } from './weekPipeline/caches';
export { checkBankruptcy } from './weekPipeline/finalize';

/**
 * V15: builds this week's sync ledger when the pool runs synced workers.
 * Only the input VERSION is recorded — workers never receive the raw input
 * (week-1 bootstraps heal straight to weekStart; mid-week spawns heal to
 * the dispatch stage; week-2+ replicas roll forward from weekResult).
 */
function createWeekSyncLedger(pool: EnginePool, state: GameState, headless?: boolean) {
  if (!pool.supportsSync) return undefined;
  return { inputWeek: state.absoluteWeek, headless, stageImpacts: {} } as WeekSyncLedger;
}

/**
 * Records the weekStart stage state + hash into the ledger and installs it
 * on the pool. weekStartState aliases mutableState — exact only within its
 * dispatch window (mapBoutShards runs before runBoutPhase's resolveImpacts)
 * — so the hash is computed eagerly, never re-derived late.
 */
function installWeekStartStage(syncLedger: WeekSyncLedger, mutableState: GameState, ctx: WeekContext, pool: EnginePool): void {
  syncLedger.weekStartState = mutableState;
  syncLedger.weekStartHash = shardStateHash(mutableState);
  syncLedger.weekContext = {
    currentWeek: ctx.currentWeek,
    nextWeek: ctx.nextWeek,
    nextYear: ctx.nextYear,
  };
  pool.setWeekLedger(syncLedger);
}

/**
 * Records the postCore stage — same alias discipline as weekStartState:
 * rival shards dispatch inside the world stage's spec.run, before
 * resolveImpacts(world) mutates this object, so the hash is eager.
 */
function recordPostCoreStage(syncLedger: WeekSyncLedger, coreImpacts: StateImpact[], stateAfterCore: GameState): void {
  syncLedger.coreImpacts = coreImpacts;
  syncLedger.postCoreState = stateAfterCore;
  syncLedger.postCoreHash = shardStateHash(stateAfterCore);
}

/**
 * Stable Lords — Consolidated Weekly Pipeline (1.0 Hardened)
 * Orchestrates the simulation tick using a high-performance batched architecture.
 */
export async function advanceWeek(state: GameState, opts?: WeekAdvanceOptions): Promise<GameState> {
  const headless = opts?.headless;
  const weekStarted = performance.now();

  assertPipelineLegal();

  // Shard pool: explicit override wins; otherwise the shared pool is used only
  // when configured > 1 (getEnginePool() lazily no-ops at size 1).
  const sharedPool = getEnginePool();
  const pool = opts?.pool ?? (sharedPool.size > 1 ? sharedPool : undefined);

  // V15: when the pool runs synced workers, the pipeline records stage
  // transitions into this ledger; workers replay them instead of receiving
  // a full-state clone per shard call.
  const syncLedger = pool ? createWeekSyncLedger(pool, state, headless) : undefined;

  // Deep clone state once at week boundary to allow safe mutation in all
  // passes — skipped when the caller grants ownership via mutableInput.
  // Sweep unfinished tournaments before the week rolls over. The three
  // non-headline seasonal tiers are never day-resolved interactively, and
  // headless batch advances skip the day ticks entirely — every bracket must
  // complete here or it lingers as a stale incomplete tournament forever.
  const preState = TournamentSelectionService.sweepUnfinishedTournaments(state, headless);

  const mutableState = createMutableWeekContext(preState, opts?.mutableInput);
  // Gazette: flush queued personal ads + a seeded rival taunt (UI content —
  // skipped headless like other newsletter generation).
  if (!headless) flushGazette(mutableState);
  const ctx: WeekContext = {
    ...prepareWeekContext(mutableState, headless),
    pool,
    syncLedger,
  };

  // Build caches once per week for O(1) lookups
  buildWeekCaches(mutableState);
  if (syncLedger && pool) installWeekStartStage(syncLedger, mutableState, ctx, pool);

  const settledState = await runBoutPhase(mutableState, ctx);
  const coreImpacts = await collectCoreImpacts(settledState, ctx);

  // Player stop conditions gate PLAYER content only — the WORLD keeps evolving.
  const playerStopped =
    checkBankruptcy(settledState, coreImpacts) || settledState.roster.length === 0;

  // Stage the pipeline: apply core impacts BEFORE running remaining passes
  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  if (syncLedger) recordPostCoreStage(syncLedger, coreImpacts, stateAfterCore);
  // Only resync caches when a core impact could have replaced roster/rival
  // identities — pure ledger/newsletter impacts leave the maps accurate.
  if (impactsAffectWeekCaches(coreImpacts)) buildWeekCaches(stateAfterCore);

  const stateAfterWorld = await runStage('world', stateAfterCore, ctx, opts);
  const result = finalizeState(
    await runStage('content', stateAfterWorld, ctx, { ...opts, playerStopped }),
    state,
    ctx
  );
  // V15: roll every synced worker to the week result — they hold it as the
  // next week's input replica, so week N+1 pays no full-state transport.
  if (syncLedger && pool) await pool.finishWeek(result);
  telemetry.timing(TelemetryEvents.ADVANCE_WEEK, performance.now() - weekStarted, {
    headless: String(Boolean(headless)),
  });
  return result;
}
