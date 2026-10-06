import { type GameState, type DeferredBoutLog, type BoutOffer } from '@/types/state.types';
import type { BoutOfferId, PromoterId } from '@/types/shared/ids';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import {
  setTelemetryProvider,
  resetTelemetryProvider,
  TelemetryEvents,
  type TelemetryProvider,
} from '@/engine/core/telemetry';
import { TickOrchestrator } from '@/engine/pipeline/tick/TickOrchestrator';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { displayWeek } from '@/engine/core/absoluteWeek';
import { isActive } from '@/engine/warrior/warriorStatus';
import { evaluateBoutOffer } from '@/engine/ai/workers/competitionWorker/boutAcceptance';
import { collectPulse, type SimPulse } from '@/engine/stats/simulationMetrics';
import { createCumulativeTracker, type CumulativeStats } from '@/engine/stats/cumulativeTracker';
import { truncateState, type TruncationCaps } from '@/engine/storage/truncation';
import { drainDeferredBoutLogs } from '@/engine/storage/deferredBoutLogs';

export type { CumulativeStats } from '@/engine/stats/cumulativeTracker';

/**
 * Minimal bout-log archive contract — satisfied by `NodeArchiveService`
 * (fs) or any test double. Kept structural so the harness stays decoupled
 * from the browser-only OPFS/Worker archive path.
 */
export interface BoutLogArchive {
  archiveBoutLog: (
    year: number,
    season: number,
    boutId: string,
    logData: string[],
    overwrite?: boolean
  ) => Promise<void>;
}

/**
 * Defines the shape of simulation config.
 */
export interface SimulationConfig {
  weeks: number;
  seed: number;
  logFrequency?: number; // Log every N weeks
  ignoreBankruptcy?: boolean;
  /** Weeks between truncateState passes. Default 50 (matches autosim); <=0 disables. */
  truncateIntervalWeeks?: number;
  /** Optional archive sink for deferred bout transcripts — drained every week. */
  archiveService?: BoutLogArchive;
  /** Optional per-array cap overrides forwarded to truncateState. */
  truncationCaps?: TruncationCaps;
  /**
   * Optional fully-formed starting state. When omitted, the harness builds
   * one via `populateInitialWorld(createFreshState(seed), seed)`. The state
   * is cloned before the run so the caller's object is never mutated.
   */
  initialState?: GameState;
  /**
   * Enable the per-pass pipeline profiler (`__SL_PIPELINE_PROF`). When set,
   * the result carries an aggregated per-pass timing table.
   */
  profile?: boolean;
  /**
   * Optional per-week observer invoked after each `advanceWeek` with the
   * post-week state and 1-based week index — used by soak.mjs to run
   * invariant checks without re-entering the loop.
   *
   * ⚠️ Aliasing: the harness advances weeks with `mutableInput`, so the
   * GameState handed to `onWeek` is the same object that later weeks will
   * mutate. Read fields synchronously; do not retain the reference to
   * compare "earlier" states (use the emitted pulses instead).
   */
  onWeek?: (state: GameState, weekIndex: number) => void;
  /**
   * Soak observability: inject one deliberately-lowball offer per week at a
   * famous rival warrior so the purse-counter path is exercised. The offer
   * resolves through the real offerProcessor sweep — 'Countered' stamps
   * `counterPurseBump` — so `counterOfferRate` measures the genuine
   * negotiation pipeline rather than sitting at 0 because organic soaks
   * never produce counter-eligible offers. Default off.
   */
  counterBait?: boolean;
  /**
   * 'week' (default): each simulated week runs `advanceWeek` once.
   * 'day': each week is ticked as seven `advanceDay` calls — exercises the
   * interactive day path (day-by-day tournament resolution + the day-7
   * weekly pipeline) that the week-mode soak never touches.
   */
  advanceMode?: 'week' | 'day';
}

/**
 * Defines the shape of simulation result.
 */
export interface SimulationResult {
  finalState: GameState;
  pulses: SimPulse[];
  cumulative: CumulativeStats;
  /** Per-pass aggregate timings — present only when `config.profile` is set. */
  profile?: PassProfileRow[];
}

/** Aggregated timing for one pipeline pass across the whole run. */
export interface PassProfileRow {
  id: string;
  stage: string;
  weeks: number;
  totalMs: number;
  avgMs: number;
  maxMs: number;
}

async function flushDeferredLogs(
  logs: DeferredBoutLog[],
  archive: BoutLogArchive
): Promise<DeferredBoutLog[]> {
  const results = await Promise.all(
    logs.map(async (log) => {
      try {
        await archive.archiveBoutLog(log.year, log.season, log.boutId, log.transcript, true);
        return null;
      } catch (err) {
        console.error(`Failed to archive bout ${log.boutId}:`, err);
        return log;
      }
    })
  );
  return results.filter((l): l is DeferredBoutLog => l !== null);
}

/** Fame floor for counter-bait selection — `purseCounter` needs fame-50 > purse. */
const COUNTER_BAIT_MIN_FAME = 80;
/** The lowball itself — below any qualifying warrior's fame floor. */
const COUNTER_BAIT_PURSE = 15;
/** Bait offers seeded per week — countered offers persist in the map, so
 *  the weekly snapshot rate accumulates to a measurable share. */
const COUNTER_BAIT_PER_WEEK = 6;

let counterBaitSeq = 0;

/**
 * Counter-bait offer (soak observability): a different stable proposes a
 * purse well under the famous warrior's fame floor, so `evaluateBoutOffer`
 * legitimately returns 'Countered'. Hard gates (injury, skepticism) precede
 * the purse check, so candidates are pre-evaluated inline — the evaluation
 * is deterministic, so the pipeline reaches the same verdict. One per week
 * is enough signal; skipped entirely when no eligible warrior exists.
 */
function seedCounterBaitOffer(state: GameState): void {
  const rivals = state.rivals ?? [];
  // Prefer a Greedy promoter — 'Greedy' promoters squeeze the fame floor.
  const promoter =
    Object.values(state.promoters ?? {}).find((p) => p.personality === 'Greedy') ??
    Object.values(state.promoters ?? {})[0];
  if (!promoter) return;
  let seeded = 0;
  for (const rival of rivals) {
    if (rival.owner?.personality === 'Aggressive') continue;
    for (const famous of rival.roster) {
      if (
        (famous.fame ?? 0) < COUNTER_BAIT_MIN_FAME ||
        famous.campaignFocus === 'PURSE_HUNTER' ||
        !isActive(famous)
      )
        continue;
      // Player-side proposer: a countered offer against a player warrior
      // stays Proposed with its bump visible — resolveCounteredOffers
      // leaves player-owned responses Pending ("the player's call"), which
      // is exactly how real counters surface. The standing bumped offer is
      // what counterOfferRate measures; it prunes only at expiration.
      for (const oppWarrior of (state.roster ?? []).filter(isActive).slice(0, 6)) {
        const id = `soak-bait-${state.absoluteWeek}-${counterBaitSeq++}` as BoutOfferId;
        const offer: BoutOffer = {
          id,
          promoterId: promoter.id as PromoterId,
          warriorIds: [famous.id, oppWarrior.id],
          boutWeek: displayWeek(state.absoluteWeek + 4),
          expirationWeek: displayWeek(state.absoluteWeek + 3),
          createdAbsoluteWeek: state.absoluteWeek,
          purse: COUNTER_BAIT_PURSE,
          hype: 10,
          status: 'Proposed',
          responses: {
            [famous.id]: 'Pending',
            [oppWarrior.id]: 'Pending',
          },
        };
        const verdict = evaluateBoutOffer({
          offer,
          rival,
          warrior: famous,
          currentWeek: state.absoluteWeek,
          weather: state.weather as never,
          opponent: oppWarrior,
          state,
        });
        if (verdict !== 'Countered') continue;
        (state.boutOffers ??= {})[id] = offer;
        if (++seeded >= COUNTER_BAIT_PER_WEEK) break;
      }
      if (seeded >= COUNTER_BAIT_PER_WEEK) break;
    }
    if (seeded >= COUNTER_BAIT_PER_WEEK) break;
  }
}

/** Headless: auto-accept attractive contracts proposed to player warriors. */
function autoRespondToPlayerOffers(state: GameState): void {
  const playerIds = new Set(state.roster.map((w) => w.id));
  const playerOffers = Object.values(state.boutOffers || {}).filter(
    (o) => o.status === 'Proposed' && o.warriorIds.some((id) => playerIds.has(id))
  );

  playerOffers.forEach((offer) => {
    const playerWarriorIds = offer.warriorIds.filter((id) => playerIds.has(id));

    if (offer.hype >= 20 || offer.purse >= 50) {
      playerWarriorIds.forEach((id) => {
        offer.responses[id] = 'Accepted';
      });

      const allResponded = offer.warriorIds.every((wid) => offer.responses[wid] !== 'Pending');
      if (allResponded) {
        offer.status = 'Signed';
      }
    }
  });
}

/**
 * Telemetry provider that folds `pipeline_pass_timing` events into the
 * aggregate table — installed by runSimulation when `config.profile` is set.
 */
function makePassProfileProvider(passAgg: Map<string, PassProfileRow>): TelemetryProvider {
  return {
    timing(name, ms, tags) {
      if (name !== TelemetryEvents.PIPELINE_PASS_TIMING || !tags?.pass) return;
      const id = tags.pass;
      const row = passAgg.get(id) ?? {
        id,
        stage: tags.stage ?? '',
        weeks: 0,
        totalMs: 0,
        avgMs: 0,
        maxMs: 0,
      };
      row.weeks++;
      row.totalMs += ms;
      row.avgMs = row.totalMs / row.weeks;
      row.maxMs = Math.max(row.maxMs, ms);
      passAgg.set(id, row);
    },
    increment() {},
    gauge() {},
  };
}

/** Drain deferred bout transcripts into the archive sink, re-queuing failures. */
async function drainArchive(state: GameState, archiveService?: BoutLogArchive): Promise<GameState> {
  if (!archiveService) return state;
  const logs = drainDeferredBoutLogs(state);
  if (logs.length === 0) return state;
  const failed = await flushDeferredLogs(logs, archiveService);
  if (failed.length > 0) {
    state.deferredBoutLogs = [...(state.deferredBoutLogs ?? []), ...failed];
  }
  return state;
}

/**
 * One simulated week: AI decisions → advance → track → archive-drain →
 * pulse log → periodic truncation. Returns the next state and whether the
 * bankruptcy stop condition fired.
 */
async function runWeek(
  state: GameState,
  w: number,
  config: SimulationConfig,
  tracker: ReturnType<typeof createCumulativeTracker>,
  pulses: SimPulse[]
): Promise<{ state: GameState; bankrupt: boolean }> {
  const { logFrequency = 1, archiveService } = config;
  const truncateInterval = config.truncateIntervalWeeks ?? 50;

  // A. Weekly Decision Logic (AI/Player)
  autoRespondToPlayerOffers(state);
  if (config.counterBait) seedCounterBaitOffer(state);

  // B. Advance Week
  // Week 1 may run on a caller-supplied initialState, so it clones; every
  // later week runs on the advance path's own output, which this loop
  // exclusively owns — skip the per-week full-state structuredClone
  // (mirrors autosim). In 'day' mode the week is ticked as seven advanceDay
  // calls: days 1–6 resolve tournament rounds / no-op, day 7 runs the
  // weekly pipeline.
  if (config.advanceMode === 'day') {
    for (let d = 0; d < 7; d++) {
      state = await TickOrchestrator.advanceDay(state, { mutableInput: w > 1 });
    }
  } else {
    state = await advanceWeek(state, { mutableInput: w > 1 });
  }

  // C. Record this week's new bouts/deaths/retirements by id — before any
  // truncation can drop the underlying entries.
  tracker.recordWeek(state);
  config.onWeek?.(state, w);

  // D. Drain deferred bout transcripts weekly when an archive sink is
  // configured — keeps peak transcript memory at ~1 week of bouts.
  // Failures are re-queued for next week's drain (same retry semantics as
  // the app path) — transcripts are never silently dropped.
  state = await drainArchive(state, archiveService);

  let totalWarriors = 0;
  state.rivals.forEach((r) => (totalWarriors += r.roster.length));

  if (w % logFrequency === 0) {
    console.log(
      `[Harness] Week ${state.week} | Roster: ${state.roster.length} | Treasury: ${state.treasury}`
    );
    const cumulative = tracker.snapshot();
    pulses.push({
      ...collectPulse(state),
      cumulativeBouts: cumulative.totalBouts,
      cumulativeDeaths: cumulative.deaths,
      cumulativeRetired: cumulative.retired,
    });
  }

  // E. Periodic truncation — same 50-week cadence as autosim. The tracker
  // needs no reset: ids already counted stay counted even when truncation
  // drops the retained entries.
  if (truncateInterval > 0 && w % truncateInterval === 0) {
    state = truncateState(state, config.truncationCaps);
  }

  // Stop Conditions (Optional)
  if (!config.ignoreBankruptcy && state.treasury < -5000) {
    console.warn(`[Sim] Failure at week ${w}: Stable Bankrupt.`);
    return { state, bankrupt: true };
  }
  return { state, bankrupt: false };
}

/**
 * Run a headless simulation loop.
 * Asynchronous and deterministic.
 */
export async function runSimulation(config: SimulationConfig): Promise<SimulationResult> {
  const { weeks, seed, archiveService } = config;
  const truncateInterval = config.truncateIntervalWeeks ?? 50;

  // 1. Initialize State — an injected initialState replaces the default
  // seeded world entirely (caller controls seeding); clone so the caller's
  // object is never mutated by the loop's offer/drain writes.
  const seedStr = seed.toString();
  let state = config.initialState
    ? structuredClone(config.initialState)
    : populateInitialWorld(createFreshState(seedStr), seed);
  const pulses: SimPulse[] = [];

  // All-time counters tracked by entity id — immune to truncation AND to any
  // mid-tick append+drop (tournamentSelection/resolution.ts appends
  // arenaHistory with an inline slice(-500)), so correctness never depends on
  // histories being append-only.
  const tracker = createCumulativeTracker(state);

  // 2. Main Loop
  console.log(`[Harness] Starting simulation for ${weeks} weeks...`);

  // Per-pass profiling is opt-in: the flag is checked once per pass, so the
  // steady-state cost is a single property read per pass per week.
  const g = globalThis as Record<string, unknown>;
  const prevProf = g.__SL_PIPELINE_PROF;
  if (config.profile) g.__SL_PIPELINE_PROF = true;
  const passAgg = new Map<string, PassProfileRow>();
  if (config.profile) setTelemetryProvider(makePassProfileProvider(passAgg));

  try {
    for (let w = 1; w <= weeks; w++) {
      const step = await runWeek(state, w, config, tracker, pulses);
      state = step.state;
      if (step.bankrupt) break;
    }
  } finally {
    if (config.profile) {
      resetTelemetryProvider();
      if (prevProf === undefined) delete g.__SL_PIPELINE_PROF;
      else g.__SL_PIPELINE_PROF = prevProf;
    }
  }

  // Final pass: flush any remaining transcripts and return a bounded state.
  // Unarchivable logs are retained in finalState (bounded by the truncation
  // below) rather than dropped.
  state = await drainArchive(state, archiveService);
  if (truncateInterval > 0) {
    state = truncateState(state, config.truncationCaps);
  }

  return {
    finalState: state,
    pulses,
    cumulative: tracker.snapshot(),
    profile: config.profile
      ? [...passAgg.values()].sort((a, b) => b.totalMs - a.totalMs)
      : undefined,
  };
}
