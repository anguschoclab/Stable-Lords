import type { GameState, Warrior } from '@/types/state.types';
import type { WarriorId, BoutOfferId } from '@/types/shared.types';
import { computeMetaDrift } from '@/engine/metaDrift';
import { SeededRNGService } from '@/utils/random';
import { resolveImpacts, StateImpact } from '@/engine/impacts';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';
import { getStablePairKey } from '@/utils/keyUtils';
import { deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { clearExpiredRest } from '@/engine/matchmaking/historyLogic';
import { loadCombatNarrative } from '@/data/narrative';
import { pruneBoutOffers } from '@/engine/bout/offerCleanup';
import {
  validatePipelinePasses,
  type WeekPassSpec,
  type WeekPipelineContext,
} from '@/engine/pipeline/pipelineStages';
import { getEnginePool, type EnginePool } from '@/engine/pool/enginePool';
import { telemetry, TelemetryEvents, isTelemetryEnabled } from '@/engine/telemetry';

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

// 🌩️ Modular Pipeline Passes
import { runBoutSimulationPass } from '../passes/BoutSimulationPass';
import { runWarriorPass } from '../passes/WarriorPass';
import { runEconomyPass } from '../passes/EconomyPass';
import { runEquipmentPass } from '../passes/EquipmentPass';
import { runWorldPass } from '../passes/WorldPass';
import { runRecruitmentPass } from '../passes/RecruitmentPass';
import { runSystemPass } from '../passes/SystemPass';
import { runRankingsPass } from '../passes/RankingsPass';
import { runPromoterPass } from '../passes/PromoterPass';
import { runPromoterLifecyclePass } from '../passes/PromoterLifecyclePass';
import { runTrainerPass } from '../passes/TrainerPass';
import { runRivalStrategyPass } from '../passes/RivalStrategyPass';
import { runEventPass } from '../passes/EventPass';
import { runNarrativePass } from '../passes/NarrativePass';
import { runSeasonalPass } from '../seasonal';
import { runProgressionPass } from '../passes/ProgressionPass';

interface WeekContext extends WeekPipelineContext {
  headless?: boolean;
}

/**
 * Dev-only per-pass profiler: when `globalThis.__SL_PIPELINE_PROF` is truthy,
 * every pass's wall-clock ms is recorded and exposed via
 * `getLastPipelineProfile()`. Zero-cost when off (a single flag check).
 */
export function isPipelineProfiling(): boolean {
  return Boolean((globalThis as Record<string, unknown>).__SL_PIPELINE_PROF);
}

/** One pass's wall-clock time within a profiled week. */
export interface PipelinePassTiming {
  id: string;
  stage: WeekPassSpec['stage'];
  ms: number;
}

let lastPipelineProfile: PipelinePassTiming[] | null = null;

/** Returns the most recent profiled week, or null when profiling is off. */
export function getLastPipelineProfile(): PipelinePassTiming[] | null {
  return lastPipelineProfile;
}

function prepareWeekContext(state: GameState, headless?: boolean): WeekContext {
  const currentWeek = state.week;
  let nextWeek = currentWeek + 1;
  let nextYear = state.year || 1;
  if (nextWeek > 52) {
    nextWeek = 1;
    nextYear++;
  }
  return {
    currentWeek,
    nextWeek,
    nextYear,
    headless,
    rootRng: new SeededRNGService(nextYear * 52 + nextWeek * 7919 + 101),
  };
}

/**
 * Declarative pipeline table. Execution order is declaration order; stages
 * resolve sequentially (core → world → content). `writes` declarations are
 * validated by `validatePipelinePasses` — asserted once per process in
 * advanceWeek and exhaustively in weekPipelineDAG.test.ts.
 */
export const WEEK_PIPELINE_PASSES: WeekPassSpec[] = [
  {
    id: 'warrior',
    stage: 'core',
    run: (s, ctx) => runWarriorPass(s, ctx.rootRng),
    writes: ['rosterUpdates', 'retired', 'hiringPool', 'seasonalGrowth', 'ledgerEntries'],
  },
  {
    id: 'economy',
    stage: 'core',
    run: (s, ctx) => runEconomyPass(s, ctx.rootRng),
    writes: ['treasuryDelta', 'ledgerEntries', 'popularityDelta', 'fameDelta'],
  },
  {
    id: 'equipment',
    stage: 'core',
    run: (s) => runEquipmentPass(s),
    writes: ['rivalsUpdates'],
  },
  {
    id: 'recruitment',
    stage: 'core',
    run: (s, ctx) => runRecruitmentPass(s, ctx.rootRng),
    writes: ['recruitPool'],
  },
  {
    id: 'world',
    stage: 'world',
    run: (s, ctx) => runWorldPass(s, ctx.nextWeek, ctx.rootRng),
    writes: ['week', 'season', 'weather', 'ownerGrudges', 'rivalries'],
  },
  {
    id: 'system',
    stage: 'world',
    run: (s, ctx) => runSystemPass(s, ctx.rootRng),
    writes: [
      'seasonalGrowth',
      'hallOfFame',
      'awards',
      'rosterUpdates',
      'rivalsUpdates',
      'newsletterItems',
    ],
  },
  {
    id: 'rankings',
    stage: 'world',
    run: (s) => runRankingsPass(s),
    writes: ['realmRankings'],
  },
  {
    id: 'progression',
    stage: 'world',
    run: (s, ctx) => runProgressionPass(s, ctx.nextWeek, ctx.nextYear),
    writes: ['progression', 'newsletterItems', 'gazettes'],
  },
  {
    id: 'promoter',
    stage: 'world',
    run: (s) => runPromoterPass(s),
    writes: ['boutOffers'],
  },
  {
    id: 'promoterLifecycle',
    stage: 'world',
    run: (s, ctx) => runPromoterLifecyclePass(s, ctx.rootRng),
    writes: ['promoters'],
  },
  {
    id: 'trainer',
    stage: 'world',
    run: (s, ctx) => runTrainerPass(s, ctx.rootRng),
    writes: ['trainers', 'hiringPool', 'rivalsUpdates'],
  },
  {
    id: 'rivalStrategy',
    stage: 'world',
    after: ['recruitment'], // draft pool must be refilled before the AI draft drains it
    run: (s, ctx) => runRivalStrategyPass(s, ctx.nextWeek, ctx.rootRng, ctx.headless, ctx.pool),
    writes: [
      'rivalsUpdates',
      'boutOffers',
      'recruitPool',
      'tournaments',
      'isTournamentWeek',
      'activeTournamentId',
      'day',
      'newsletterItems',
      'retired',
    ],
  },
  {
    id: 'event',
    stage: 'content',
    playerFacing: true,
    run: (s, ctx) => runEventPass(s, ctx.nextWeek, ctx.rootRng),
    writes: ['rosterUpdates', 'newsletterItems', 'ledgerEntries', 'treasuryDelta'],
  },
  {
    id: 'narrative',
    stage: 'content',
    playerFacing: true,
    run: (s, ctx) => runNarrativePass(s, ctx.currentWeek, ctx.nextWeek, ctx.rootRng),
    writes: ['gazettes', 'newsletterItems'],
  },
  {
    id: 'seasonal',
    stage: 'content',
    run: (s, ctx) => runSeasonalPass(s, ctx.nextWeek, ctx.rootRng),
    writes: ['rosterUpdates', 'treasuryDelta', 'ledgerEntries', 'insightTokens', 'newsletterItems'],
  },
];

let pipelineValidated = false;
function assertPipelineLegal(): void {
  if (pipelineValidated) return;
  const issues = validatePipelinePasses(WEEK_PIPELINE_PASSES);
  if (issues.length > 0) {
    throw new Error(
      `Illegal week pipeline declaration:\n${issues.map((i) => ` - ${i.message}`).join('\n')}`
    );
  }
  pipelineValidated = true;
}

/**
 * Per-week lookup caches live on the state object but are NOT serializable
 * (Maps) — strip them before cloning so the worker path never pays to clone
 * maps that get rebuilt anyway.
 */
function stripWeekCaches(state: GameState): GameState {
  const {
    warriorMap: _wm,
    cachedMetaDrift: _cmd,
    warriorToStableMap: _wts,
    rivalMap: _rm,
    rivalryMap: _rvm,
    grudgeMap: _gm,
    warriorToOfferIds: _wto,
    ...rest
  } = state;
  return rest as GameState;
}

/**
 * Creates a mutable copy of the game state for the week pipeline.
 * Uses structuredClone for deep cloning, allowing passes to mutate freely —
 * unless the caller grants ownership via `mutableInput`.
 */
function createMutableWeekContext(state: GameState, mutableInput?: boolean): GameState {
  if (mutableInput) return stripWeekCaches(state);
  const stripped = stripWeekCaches(state);
  if (isTelemetryEnabled()) {
    const t0 = performance.now();
    const cloned = structuredClone(stripped);
    telemetry.timing(TelemetryEvents.SERIALIZATION_CLONE_MS, performance.now() - t0);
    return cloned;
  }
  return structuredClone(stripped);
}

/**
 * Builds warrior and rival maps once per week for O(1) lookups.
 * Called at the start of advanceWeek and re-run after every impact-resolution
 * boundary so caches never point at pre-impact object identities (impact
 * handlers replace objects — e.g. rosterUpdates produces a new Warrior).
 */
export function buildWeekCaches(state: GameState): void {
  const warriorMap = new Map<WarriorId, Warrior>();
  state.roster.forEach((w) => warriorMap.set(w.id, w));
  (state.rivals || []).forEach((r) => r.roster.forEach((w) => warriorMap.set(w.id, w)));
  state.warriorMap = warriorMap;

  const warriorToStableMap = new Map<string, { stableId: string; isPlayer: boolean }>();
  state.roster.forEach((w) =>
    warriorToStableMap.set(w.id, { stableId: state.player.id, isPlayer: true })
  );
  (state.rivals || []).forEach((r) =>
    r.roster.forEach((w) => warriorToStableMap.set(w.id, { stableId: r.id, isPlayer: false }))
  );
  state.warriorToStableMap = warriorToStableMap;

  const rivalMap = new Map<string, import('@/types/state.types').RivalStableData>();
  (state.rivals || []).forEach((r) => rivalMap.set(r.id, r));
  state.rivalMap = rivalMap;

  const rivalryMap = new Map<string, import('@/types/state.types').Rivalry>();
  (state.rivalries || []).forEach((rv) =>
    rivalryMap.set(getStablePairKey(rv.stableIdA, rv.stableIdB), rv)
  );
  state.rivalryMap = rivalryMap;

  const grudgeMap = new Map<string, import('@/types/state.types').OwnerGrudge>();
  (state.ownerGrudges || []).forEach((g) =>
    grudgeMap.set(getStablePairKey(g.ownerIdA, g.ownerIdB), g)
  );
  state.grudgeMap = grudgeMap;
}

async function runBoutPhase(
  state: GameState,
  ctx: WeekContext
): Promise<GameState> {
  // Safety net: ensure combat narrative data is loaded before bout resolution
  // (memoized promise — a resolved-promise no-op after first load).
  await loadCombatNarrative();
  const metaDrift = computeMetaDrift(state.arenaHistory || []);
  const { impact: boutImpact, results, summary } = await runBoutSimulationPass(
    state,
    ctx.rootRng,
    ctx.headless,
    ctx.pool
  );
  const settledState = resolveImpacts(state, [boutImpact]);
  settledState.cachedMetaDrift = metaDrift;

  // Stash bout display data for the main thread to build pendingResolutionData
  settledState.lastWeekBoutDisplay = {
    results,
    deathNames: summary.deathNames,
    injuryNames: summary.injuryNames,
  };

  // Resync all week caches: impact handlers replaced warrior/rival objects,
  // so warriorMap & friends still point at pre-bout identities. Rebuilding
  // covers deaths, injuries, and roster changes in one pass (supersedes the
  // old invalidateDeadWarriors + manual rivalMap rebuild — NF2 fix).
  buildWeekCaches(settledState);

  return settledState;
}

/**
 * Runs every pass in a resolution stage against the same snapshot, then
 * applies the merged impacts and resyncs the week caches. Passes run in
 * declaration order and are awaited individually — intra-pass sharding may
 * parallelize work inside a pass, but stage semantics stay sequential.
 */
async function runStage(
  stage: WeekPassSpec['stage'],
  state: GameState,
  ctx: WeekContext,
  opts?: WeekAdvanceOptions
): Promise<GameState> {
  const profiling = isPipelineProfiling();
  const impacts: StateImpact[] = [];
  for (const spec of WEEK_PIPELINE_PASSES) {
    if (spec.stage !== stage) continue;
    if (spec.playerFacing && (opts?.headless || opts?.playerStopped)) continue;
    const started = profiling ? performance.now() : 0;
    impacts.push(await spec.run(state, ctx));
    if (profiling) {
      const ms = performance.now() - started;
      lastPipelineProfile?.push({ id: spec.id, stage, ms });
      telemetry.timing(TelemetryEvents.PIPELINE_PASS_TIMING, ms, {
        pass: spec.id,
      });
    }
  }
  const resolved = resolveImpacts(state, impacts);
  buildWeekCaches(resolved);
  return resolved;
}

/**
 * Check whether the treasury would fall below the bankruptcy threshold after applying core impacts.
 */
export function checkBankruptcy(state: GameState, coreImpacts: StateImpact[]): boolean {
  const netTreasuryDelta = coreImpacts.reduce((sum, i) => sum + (i.treasuryDelta ?? 0), 0);
  return state.treasury + netTreasuryDelta < BANKRUPTCY_THRESHOLD;
}

/**
 * Preview the core-stage impacts without applying them. The bankruptcy gate
 * needs the projected treasury delta before commit.
 */
async function collectCoreImpacts(state: GameState, ctx: WeekContext): Promise<StateImpact[]> {
  const impacts: StateImpact[] = [];
  const profiling = isPipelineProfiling();
  for (const spec of WEEK_PIPELINE_PASSES) {
    if (spec.stage !== 'core') continue;
    const started = profiling ? performance.now() : 0;
    impacts.push(await spec.run(state, ctx));
    if (profiling) {
      const ms = performance.now() - started;
      lastPipelineProfile?.push({ id: spec.id, stage: 'core', ms });
      telemetry.timing(TelemetryEvents.PIPELINE_PASS_TIMING, ms, {
        pass: spec.id,
      });
    }
  }
  return impacts;
}

function finalizeState(state: GameState, oldState: GameState, ctx: WeekContext): GameState {
  state.week = ctx.nextWeek;
  state.year = ctx.nextYear;
  state.absoluteWeek = deriveAbsoluteWeek(ctx.nextYear, ctx.nextWeek);
  state.day = 0;

  // All-time counters — immune to the periodic truncation of arenaHistory.
  // next === prev.slice(K) ++ appended (truncation only ever drops a prefix),
  // so the boundary is located by scanning backwards for prev's last id —
  // O(appended) instead of an O(history) Set-diff per array. Falls back to
  // the diff if the expected suffix structure doesn't hold (defensive).
  const prevLifetime = state.lifetimeStats ?? { bouts: 0, kills: 0, retirements: 0 };
  const newIds = <T extends { id: unknown }>(next: T[] | undefined, prev: T[] | undefined) => {
    const n = next ?? [];
    const p = prev ?? [];
    const lastPrevId = p.length > 0 ? p[p.length - 1]?.id : undefined;
    if (lastPrevId === undefined) return n.length;
    let boundary = -1;
    for (let i = n.length - 1; i >= 0; i--) {
      if (n[i]?.id === lastPrevId) {
        boundary = i + 1;
        break;
      }
    }
    // Sanity: retained prefix must align with prev's tail (covers duplicate ids).
    if (boundary >= 0 && p[p.length - boundary]?.id === n[0]?.id) {
      return n.length - boundary;
    }
    const seen = new Set(p.map((x) => x.id));
    return n.filter((x) => !seen.has(x.id)).length;
  };
  state.lifetimeStats = {
    bouts: prevLifetime.bouts + newIds(state.arenaHistory, oldState.arenaHistory),
    kills: prevLifetime.kills + newIds(state.graveyard, oldState.graveyard),
    retirements: prevLifetime.retirements + newIds(state.retired, oldState.retired),
  };

  state.trainingAssignments = (state.trainingAssignments ?? [])
    .filter((a) => a.type === 'trait' && (a.weeksRemaining ?? 0) > 1)
    .map((a) => ({ ...a, weeksRemaining: (a.weeksRemaining ?? 0) - 1 }));

  // Prune expired rest states so warriors become bookable again after KO recovery
  state.restStates = clearExpiredRest(state.restStates || [], state.absoluteWeek);

  // 🧹 Bout offer cleanup — single implementation in offerCleanup.ts, shared
  // with RivalStrategyPass's pre-bidding purge.
  if (state.boutOffers) {
    const justFinishedWeek = deriveAbsoluteWeek(ctx.nextYear, ctx.nextWeek) - 1;
    state.boutOffers = pruneBoutOffers(state.boutOffers, justFinishedWeek);
  }

  // Build warrior→offerIds index for O(1) lookup in autosim
  const warriorToOfferIds = new Map<WarriorId, BoutOfferId[]>();
  for (const offer of Object.values(state.boutOffers || {})) {
    for (const wId of offer.warriorIds) {
      let list = warriorToOfferIds.get(wId as WarriorId);
      if (!list) {
        list = [];
        warriorToOfferIds.set(wId as WarriorId, list);
      }
      list.push(offer.id);
    }
  }
  state.warriorToOfferIds = warriorToOfferIds;

  if (state.season !== oldState.season) {
    state.seasonalGrowth = (state.seasonalGrowth ?? []).filter((sg) => sg.season === state.season);
    // Season points race resets at the season boundary for every warrior.
    state.roster = state.roster.map((w) => (w.seasonPoints ? { ...w, seasonPoints: 0 } : w));
    if (state.rivals) {
      state.rivals = state.rivals.map((r) => ({
        ...r,
        seasonalGrowth: r.seasonalGrowth?.filter((sg) => sg.season === state.season),
        roster: r.roster.map((w) => (w.seasonPoints ? { ...w, seasonPoints: 0 } : w)),
      }));
    }
    // Season boundary changed roster identities — resync caches.
    buildWeekCaches(state);
  }

  // Handle OPFS archiving — always defer to off-thread flush for consistency
  const pendingArchives: Array<{
    year: number;
    season: number;
    boutId: string;
    transcript: string[];
  }> = [];
  for (const summary of state.arenaHistory || []) {
    if (summary.transcript && summary.transcript.length > 0 && summary.week === ctx.currentWeek) {
      const seasonIdx = ['Spring', 'Summer', 'Fall', 'Winter'].indexOf(state.season);
      pendingArchives.push({
        year: state.year,
        season: seasonIdx >= 0 ? seasonIdx : 0,
        boutId: summary.id,
        transcript: summary.transcript,
      });
      // Clear transcript to save memory
      summary.transcript = undefined;
    }
  }

  // Store in state for batch flushing (drained by the main-thread caller —
  // this function never performs I/O itself).
  state.deferredBoutLogs = [...(state.deferredBoutLogs || []), ...pendingArchives];
  return state;
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

  if (isPipelineProfiling()) lastPipelineProfile = [];

  // Deep clone state once at week boundary to allow safe mutation in all
  // passes — skipped when the caller grants ownership via mutableInput.
  const mutableState = createMutableWeekContext(state, opts?.mutableInput);
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
