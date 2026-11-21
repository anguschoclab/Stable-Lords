import type { GameState } from '@/types/state.types';
import type { StateImpact } from '@/engine/impacts';
import { resolveImpacts } from '@/engine/impacts';
import { TournamentSelectionService } from '@/engine/matchmaking/tournamentSelection';
import { createMutableWeekContext } from '@/engine/pipeline/services/weekPipeline/context';
import {
  buildWeekCaches,
  impactsAffectWeekCaches,
} from '@/engine/pipeline/services/weekPipeline/caches';
import { finalizeState } from '@/engine/pipeline/services/weekPipeline/finalize';
import { flushGazette } from '@/engine/narrative/gazette';
import { computeMetaDrift } from '@/engine/analytics/metaDrift';
import { SeededRNG } from '@/utils/random';
import {
  narrowRivalShardState,
  buildSuccessorIndex,
  runRivalShardChunk,
  type RivalShardInput,
  type RivalShardOutput,
} from '@/engine/pipeline/passes/rivalStableShard';
import { buildPerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';
import { buildActiveWarriorMap } from '@/utils/roster';
import { getMoodModifiers } from '@/engine/bout/crowdMood';
import { runBoutShardChunk, type BoutShardInput } from '@/engine/pool/enginePool';
import type { BoutShardOutput } from '@/engine/pool/shardTypes';
import { shardStateHash } from '@/engine/pool/stateHash';
import type { WeekContext } from '@/engine/pipeline/services/weekPipeline/context';

/**
 * V15 — persistent shard-state machine for shard workers.
 *
 * The worker holds a synced replica of the coordinator's GameState across
 * weeks. Instead of cloning the multi-MB state per shard call, the
 * coordinator broadcasts only what it computed anyway — bout impacts, core
 * impacts, stage impacts — and the worker replays the SAME deterministic
 * boundary functions the pipeline runs (sweepUnfinishedTournaments,
 * flushGazette, buildWeekCaches, resolveImpacts, finalizeState). Output is
 * identical by construction; each sync call returns a state hash the
 * coordinator uses to detect drift and heal by resending the full state.
 *
 * `synced` is the pristine advanceWeek-input replica (kept intact for
 * finalizeState's oldState reads). `work` is the current-week mutable copy,
 * cloned fresh from `synced` at weekStart — mutations never leak into the
 * input replica.
 */
export type ShardSyncStage = 'input' | 'weekStart' | 'postCore' | 'weekResult';

/** Replay inputs for one stage transition — one variant per stage. */
export type ShardAdvancePayload =
  | { headless?: boolean } // weekStart: replay boundary fns
  | {
      // postCore: apply bout settlement + core impacts (replicates
      // runBoutPhase tail + resolveImpacts(coreImpacts))
      boutImpact: StateImpact;
      lastWeekBoutDisplay: GameState['lastWeekBoutDisplay'];
      coreImpacts: StateImpact[];
    }
  | {
      // weekResult: apply world+content impacts, then finalizeState
      worldImpacts: StateImpact[];
      contentImpacts: StateImpact[];
      currentWeek: number;
      nextWeek: number;
      nextYear: number;
      headless?: boolean;
    };

/**
 * Worker's persistent shard state: the pristine input replica (`synced`)
 * plus the mutable working copy (`work`) built from it at weekStart.
 */
export interface SyncedShardStore {
  synced?: GameState;
  work?: GameState;
  stage: ShardSyncStage;
  /** Absolute week of the synced input — the sync version token. */
  inputWeek?: number;
}

/** Fresh store before any sync — stage 'input', no replica held. */
export function createSyncedShardStore(): SyncedShardStore {
  return { stage: 'input' };
}

/**
 * Healing send mid-week: install `state` as the working copy at `stage`.
 * A worker healed mid-week has no pristine input replica — weekResult
 * replay can't run finalizeState, so the coordinator must send the result.
 */
export function forceShardState(
  store: SyncedShardStore,
  state: GameState,
  stage: ShardSyncStage
): string {
  if (stage === 'input' || stage === 'weekResult') {
    store.synced = state;
    store.work = undefined;
    store.inputWeek = state.absoluteWeek;
  } else {
    store.work = state;
    store.inputWeek = undefined;
  }
  store.stage = stage;
  return shardStateHash(state);
}

function requireWork(store: SyncedShardStore): GameState {
  if (!store.work) throw new Error(`shard sync: no working state at stage ${store.stage}`);
  return store.work;
}

/**
 * Replay one stage transition on the worker's held state and return the
 * resulting stage-state hash — the worker-side counterpart the coordinator
 * verifies against its ledger hash. Throws when the required base replica
 * is missing (the coordinator then heals via forceShardState).
 */
export function advanceShardTo(
  store: SyncedShardStore,
  stage: 'weekStart' | 'postCore' | 'weekResult',
  payload: ShardAdvancePayload
): string {
  if (stage === 'weekStart') {
    if (!store.synced) throw new Error('shard sync: no input replica for weekStart replay');
    const headless = (payload as { headless?: boolean }).headless;
    // Replicates advanceWeek's week boundary exactly: sweep → clone →
    // gazette → caches. createMutableWeekContext clones so `synced` stays
    // pristine for finalizeState's oldState reads at weekResult.
    const pre = TournamentSelectionService.sweepUnfinishedTournaments(store.synced, headless);
    const work = createMutableWeekContext(pre, false);
    if (!headless) flushGazette(work);
    buildWeekCaches(work);
    store.work = work;
    store.stage = 'weekStart';
    return shardStateHash(work);
  }

  const work = requireWork(store);

  if (stage === 'postCore') {
    const p = payload as {
      boutImpact: StateImpact;
      lastWeekBoutDisplay: GameState['lastWeekBoutDisplay'];
      coreImpacts: StateImpact[];
    };
    // Replicates runBoutPhase's tail: metaDrift reads pre-impact
    // arenaHistory, then the bout impact settles, then caches resync.
    const metaDrift = computeMetaDrift(work.arenaHistory || []);
    resolveImpacts(work, [p.boutImpact]);
    work.cachedMetaDrift = metaDrift;
    work.lastWeekBoutDisplay = p.lastWeekBoutDisplay;
    if (impactsAffectWeekCaches([p.boutImpact])) buildWeekCaches(work);
    // Replicates resolveImpacts(settledState, coreImpacts) + cache gate.
    resolveImpacts(work, p.coreImpacts);
    if (impactsAffectWeekCaches(p.coreImpacts)) buildWeekCaches(work);
    store.stage = 'postCore';
    return shardStateHash(work);
  }

  // weekResult
  const p = payload as {
    worldImpacts: StateImpact[];
    contentImpacts: StateImpact[];
    currentWeek: number;
    nextWeek: number;
    nextYear: number;
    headless?: boolean;
  };
  if (!store.synced) throw new Error('shard sync: no input replica for weekResult replay');
  resolveImpacts(work, p.worldImpacts);
  if (impactsAffectWeekCaches(p.worldImpacts)) buildWeekCaches(work);
  resolveImpacts(work, p.contentImpacts);
  if (impactsAffectWeekCaches(p.contentImpacts)) buildWeekCaches(work);
  const ctx: WeekContext = {
    currentWeek: p.currentWeek,
    nextWeek: p.nextWeek,
    nextYear: p.nextYear,
    headless: p.headless,
    rootRng: new SeededRNG(0),
  };
  const result = finalizeState(work, store.synced, ctx);
  store.synced = result;
  store.work = undefined;
  store.stage = 'weekResult';
  store.inputWeek = result.absoluteWeek;
  return shardStateHash(result);
}

/** Bout shard dispatch against the synced working state (weekStart). */
export function runSyncedBoutShardChunk(
  store: SyncedShardStore,
  inputs: BoutShardInput[],
  opts: { headless?: boolean }
): BoutShardOutput[] {
  const work = requireWork(store);
  return runBoutShardChunk(inputs, {
    state: work,
    warriorMap: work.warriorMap ?? buildActiveWarriorMap(work),
    moodMods: getMoodModifiers(work.crowdMood),
    headless: opts.headless,
  });
}

/** Rival shard dispatch against the synced working state (postCore). */
export function runSyncedRivalShardChunk(
  store: SyncedShardStore,
  inputs: RivalShardInput[],
  opts: { nextWeek: number }
): RivalShardOutput[] {
  const work = requireWork(store);
  return runRivalShardChunk(inputs, {
    state: narrowRivalShardState(work),
    perception: buildPerceptionSnapshot(work),
    successorByStable: buildSuccessorIndex(work.retired),
    nextWeek: opts.nextWeek,
  });
}
