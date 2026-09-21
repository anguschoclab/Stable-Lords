import { type GameState, type DeferredBoutLog } from '@/types/state.types';
import { advanceWeek } from '@/engine/pipeline/services/weekPipelineService';
import { populateInitialWorld } from '@/engine/core/worldSeeder';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { collectPulse, type SimPulse } from '@/engine/stats/simulationMetrics';
import {
  createCumulativeTracker,
  type CumulativeStats,
} from '@/engine/stats/cumulativeTracker';
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
}

/**
 * Defines the shape of simulation result.
 */
export interface SimulationResult {
  finalState: GameState;
  pulses: SimPulse[];
  cumulative: CumulativeStats;
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

/**
 * Run a headless simulation loop.
 * Asynchronous and deterministic.
 */
export async function runSimulation(config: SimulationConfig): Promise<SimulationResult> {
  const { weeks, seed, logFrequency = 1, archiveService } = config;
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

  for (let w = 1; w <= weeks; w++) {
    // A. Weekly Decision Logic (AI/Player)

    // Headless: Auto-Respond to Player Contracts
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

    // B. Advance Week
    state = await advanceWeek(state);

    // C. Record this week's new bouts/deaths/retirements by id — before any
    // truncation can drop the underlying entries.
    tracker.recordWeek(state);

    // D. Drain deferred bout transcripts weekly when an archive sink is
    // configured — keeps peak transcript memory at ~1 week of bouts.
    // Failures are re-queued for next week's drain (same retry semantics as
    // the app path) — transcripts are never silently dropped.
    if (archiveService) {
      const logs = drainDeferredBoutLogs(state);
      if (logs.length > 0) {
        const failed = await flushDeferredLogs(logs, archiveService);
        if (failed.length > 0) {
          state.deferredBoutLogs = [...(state.deferredBoutLogs ?? []), ...failed];
        }
      }
    }

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
    if (!config.ignoreBankruptcy) {
      if (state.treasury < -5000) {
        console.warn(`[Sim] Failure at week ${w}: Stable Bankrupt.`);
        break;
      }
    }
  }

  // Final pass: flush any remaining transcripts and return a bounded state.
  // Unarchivable logs are retained in finalState (bounded by the truncation
  // below) rather than dropped.
  if (archiveService) {
    const logs = drainDeferredBoutLogs(state);
    if (logs.length > 0) {
      const failed = await flushDeferredLogs(logs, archiveService);
      if (failed.length > 0) {
        state.deferredBoutLogs = [...(state.deferredBoutLogs ?? []), ...failed];
      }
    }
  }
  if (truncateInterval > 0) {
    state = truncateState(state, config.truncationCaps);
  }

  return {
    finalState: state,
    pulses,
    cumulative: tracker.snapshot(),
  };
}
