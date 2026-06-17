import type { GameState, Warrior, BoutOffer } from '@/types/state.types';
import type { WarriorId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { archiveWeekLogs } from '../adapters/opfsArchiver';
import { computeMetaDrift } from '@/engine/metaDrift';
import { SeededRNGService } from '@/utils/random';
import { resolveImpacts, StateImpact } from '@/engine/impacts';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';

/**
 * Options for week advancement
 */
export interface WeekAdvanceOptions {
  /** Skip UI-facing content generation (newsletters, gazettes) for headless mode */
  headless?: boolean;
  /** Defer OPFS archiving - accumulate logs in state instead of writing immediately */
  deferArchives?: boolean;
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

interface WeekContext {
  currentWeek: number;
  nextWeek: number;
  nextYear: number;
  rootRng: IRNGService;
}

function prepareWeekContext(state: GameState): WeekContext {
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
    rootRng: new SeededRNGService(nextYear * 52 + nextWeek * 7919 + 101),
  };
}

/**
 * Creates a mutable copy of the game state for the week pipeline.
 * Uses structuredClone for deep cloning, allowing passes to mutate freely.
 * This replaces the shallow-copy-then-mutate pattern in resolveImpacts.
 */
function createMutableWeekContext(state: GameState): GameState {
  return structuredClone(state);
}

/**
 * Builds warrior and rival maps once per week for O(1) lookups.
 * Called at the start of advanceWeek and selectively invalidated when warriors die.
 */
function buildWeekCaches(state: GameState): void {
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
}

/**
 * Invalidates warrior caches for dead/retired warriors only.
 * More efficient than rebuilding all maps from scratch.
 */
function invalidateDeadWarriors(state: GameState, deadIds: Set<WarriorId>): void {
  if (deadIds.size === 0) return;

  // Remove dead warriors from maps
  deadIds.forEach((id) => {
    state.warriorMap?.delete(id);
    state.warriorToStableMap?.delete(id);
  });
}

function runBoutPhase(state: GameState, ctx: WeekContext, headless?: boolean): GameState {
  // Maps are already built by buildWeekCaches at the week boundary
  const metaDrift = computeMetaDrift(state.arenaHistory || []);
  const boutImpact = runBoutSimulationPass(state, ctx.rootRng, headless);
  const settledState = resolveImpacts(state, [boutImpact]);
  settledState.cachedMetaDrift = metaDrift;

  // Collect dead warrior IDs for selective cache invalidation
  const deadIds = new Set<WarriorId>();
  (settledState.graveyard || []).forEach((w) => deadIds.add(w.id));
  invalidateDeadWarriors(settledState, deadIds);

  return settledState;
}

function collectCoreImpacts(state: GameState, ctx: WeekContext): StateImpact[] {
  return [
    runWarriorPass(state, ctx.rootRng),
    runEconomyPass(state, ctx.rootRng),
    runEquipmentPass(state),
    // RecruitmentPass refills the draft pool. Must land before RivalStrategyPass
    // (which drains it) — otherwise both run in parallel against the same
    // pre-impact state and the post-recruitment pool gets clobbered by the
    // post-draft pool, leaving the pool empty every tick.
    runRecruitmentPass(state, ctx.rootRng),
  ];
}

function checkBankruptcy(state: GameState, coreImpacts: StateImpact[]): boolean {
  const economyImpact = coreImpacts.find((i) => i.treasuryDelta !== undefined);
  const estimatedTreasury = state.treasury + (economyImpact?.treasuryDelta || 0);
  return estimatedTreasury < BANKRUPTCY_THRESHOLD;
}

function collectRemainingImpacts(
  state: GameState,
  ctx: WeekContext,
  opts?: WeekAdvanceOptions
): StateImpact[] {
  const impacts: StateImpact[] = [
    runWorldPass(state, ctx.nextWeek, ctx.rootRng),
    runSystemPass(state, ctx.rootRng),
    runRankingsPass(state),
    runPromoterPass(state),
    runPromoterLifecyclePass(state, ctx.rootRng),
    runTrainerPass(state, ctx.rootRng),
    runRivalStrategyPass(state, ctx.nextWeek, ctx.rootRng, opts?.headless),
  ];

  // In headless mode, skip expensive content generation passes
  if (!opts?.headless) {
    impacts.push(runEventPass(state, ctx.nextWeek, ctx.rootRng));
    impacts.push(runNarrativePass(state, ctx.currentWeek, ctx.nextWeek, ctx.rootRng));
  }

  impacts.push(runSeasonalPass(state, ctx.nextWeek, ctx.rootRng));
  return impacts;
}

function finalizeState(
  state: GameState,
  oldState: GameState,
  ctx: WeekContext,
  opts?: WeekAdvanceOptions
): GameState {
  state.week = ctx.nextWeek;
  state.year = ctx.nextYear;
  state.day = 0;
  state.trainingAssignments = [];

  // 🧹 Bout offer cleanup — single source of truth for offer pruning.
  if (state.boutOffers) {
    const cleanedOffers: Record<string, BoutOffer> = {};
    const justFinishedWeek = ctx.nextWeek - 1;
    Object.values(state.boutOffers).forEach((offer) => {
      if (offer.boutWeek <= justFinishedWeek) return;
      if (
        offer.status !== 'Signed' &&
        offer.expirationWeek != null &&
        offer.expirationWeek <= justFinishedWeek
      ) {
        return;
      }
      cleanedOffers[offer.id] = offer;
    });
    state.boutOffers = cleanedOffers;
  }

  if (state.season !== oldState.season) {
    state.seasonalGrowth = (state.seasonalGrowth ?? []).filter((sg) => sg.season === state.season);
  }

  // Handle OPFS archiving
  if (opts?.deferArchives) {
    // In batch mode, defer archives to state for later flushing
    // Accumulate bout logs in state.deferredBoutLogs
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

    // Store in state for batch flushing
    state.deferredBoutLogs = [...(state.deferredBoutLogs || []), ...pendingArchives];
    return state;
  }

  // Normal mode: archive immediately
  return archiveWeekLogs(state);
}

/**
 * Stable Lords — Consolidated Weekly Pipeline (1.0 Hardened)
 * Orchestrates the simulation tick using a high-performance batched architecture.
 */
export function advanceWeek(state: GameState, opts?: WeekAdvanceOptions): GameState {
  const headless = opts?.headless;

  // Deep clone state once at week boundary to allow safe mutation in all passes
  const mutableState = createMutableWeekContext(state);
  const ctx = prepareWeekContext(mutableState);

  // Build caches once per week for O(1) lookups
  buildWeekCaches(mutableState);

  const settledState = runBoutPhase(mutableState, ctx, headless);
  const coreImpacts = collectCoreImpacts(settledState, ctx);

  // Unified stop conditions: bankruptcy and roster-empty are checked every week
  if (checkBankruptcy(settledState, coreImpacts) || settledState.roster.length === 0) {
    // Always apply world pass so season/weather advance even on stop conditions
    const stopImpacts: StateImpact[] = [...coreImpacts, runWorldPass(settledState, ctx.nextWeek, ctx.rootRng)];
    return finalizeState(resolveImpacts(settledState, stopImpacts), state, ctx, opts);
  }

  // Stage the pipeline: apply core impacts BEFORE running remaining passes
  const stateAfterCore = resolveImpacts(settledState, coreImpacts);
  const remainingImpacts = collectRemainingImpacts(stateAfterCore, ctx, { headless });
  return finalizeState(resolveImpacts(stateAfterCore, remainingImpacts), state, ctx, opts);
}
