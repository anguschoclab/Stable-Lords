import type { GameState } from '@/types/state.types';
import { resolveImpacts } from '@/engine/impacts';
import { getEnginePool, type EnginePool } from '@/engine/pool/enginePool';
import { telemetry, TelemetryEvents } from '@/engine/core/telemetry';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { isPipelineProfiling, beginPipelineProfile } from './weekPipeline/profiling';
import {
  prepareWeekContext,
  createMutableWeekContext,
  type WeekContext,
} from './weekPipeline/context';
import { assertPipelineLegal } from './weekPipeline/passes';
import { buildWeekCaches } from './weekPipeline/caches';
import { runStage, runBoutPhase, collectCoreImpacts } from './weekPipeline/stages';
import { checkBankruptcy, finalizeState } from './weekPipeline/finalize';

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

export {
  isPipelineProfiling,
  getLastPipelineProfile,
  type PipelinePassTiming,
} from './weekPipeline/profiling';
export { WEEK_PIPELINE_PASSES } from './weekPipeline/passes';
export { buildWeekCaches } from './weekPipeline/caches';
export { checkBankruptcy } from './weekPipeline/finalize';

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

  if (isPipelineProfiling()) beginPipelineProfile();

  // Deep clone state once at week boundary to allow safe mutation in all
  // passes — skipped when the caller grants ownership via mutableInput.
  // Sweep unfinished tournaments before the week rolls over. The three
  // non-headline seasonal tiers are never day-resolved interactively, and
  // headless batch advances skip the day ticks entirely — every bracket must
  // complete here or it lingers as a stale incomplete tournament forever.
  let preState = state;
  const unfinished = (state.tournaments ?? []).filter((t) => !t.completed);
  for (let i = 0; i < unfinished.length; i++) {
    const tour = unfinished[i];
    if (!tour) continue;
    // Index stride must exceed the round counter width inside
    // resolveCompleteTournament (safety < 10): a `+ i` stride made
    // tournament i's round s+1 share a seed with tournament i+1's round s —
    // identical RNG streams, identical bout ids and correlated fight draws.
    preState = TournamentSelectionService.resolveCompleteTournament(
      preState,
      tour.id,
      preState.year * 10000 + preState.week * 100 + 7 + i * 16,
      headless
    );
  }

  const mutableState = createMutableWeekContext(preState, opts?.mutableInput);
  const ctx: WeekContext = { ...prepareWeekContext(mutableState, headless), pool };

  // Build caches once per week for O(1) lookups
  buildWeekCaches(mutableState);

  const settledState = await runBoutPhase(mutableState, ctx);
  const coreImpacts = await collectCoreImpacts(settledState, ctx);

  // Player stop conditions gate PLAYER content only — the WORLD keeps evolving.
  const playerStopped =
    checkBankruptcy(settledState, coreImpacts) || settledState.roster.length === 0;

  // Stage the pipeline: apply core impacts BEFORE running remaining passes
  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  buildWeekCaches(stateAfterCore);

  const stateAfterWorld = await runStage('world', stateAfterCore, ctx, opts);
  const result = finalizeState(
    await runStage('content', stateAfterWorld, ctx, { ...opts, playerStopped }),
    state,
    ctx
  );
  telemetry.timing(TelemetryEvents.ADVANCE_WEEK, performance.now() - weekStarted, {
    headless: String(Boolean(headless)),
  });
  return result;
}
