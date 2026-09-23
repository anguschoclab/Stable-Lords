import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { FightId, SimulationReportId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  processWeekBouts,
  processWeekBoutsSharded,
  type BoutResult,
  type WeekBoutSummary,
} from '@/engine/bout/services/boutProcessorService';
import type { EnginePool } from '@/engine/pool/enginePool';
import { generateId } from '@/utils/idUtils';
import { StateImpact } from '@/engine/impacts';
import { gameYearWeekToTimestamp } from '@/constants';

/** Output of the bout simulation pass. */
export interface BoutPassOutput {
  impact: StateImpact;
  results: BoutResult[];
  summary: WeekBoutSummary;
}

/**
 * Stable Lords — Bout Simulation Pipeline Pass
 * Integrates the legacy bout processor into the standard modular pipeline.
 * When a `pool` with size > 1 is supplied, bout resolution is distributed
 * across shard workers; output merges in pairing order, identical to the
 * sequential path.
 */
export function runBoutSimulationPass(
  state: GameState,
  _rng: IRNGService,
  headless?: boolean
): BoutPassOutput;
export function runBoutSimulationPass(
  state: GameState,
  _rng: IRNGService,
  headless: boolean | undefined,
  pool: EnginePool | undefined
): BoutPassOutput | Promise<BoutPassOutput>;
export function runBoutSimulationPass(
  state: GameState,
  _rng: IRNGService,
  headless?: boolean,
  pool?: EnginePool
): BoutPassOutput | Promise<BoutPassOutput> {
  // Although processWeekBouts uses its own deterministic seeds via hashStr,
  // we wrap it here to maintain pipeline consistency for the 1.0 release.
  const boutOutput =
    pool && pool.size > 1
      ? processWeekBoutsSharded(state, headless, pool)
      : processWeekBouts(state, headless);
  const finish = ({
    impact: boutImpact,
    results,
    summary,
  }: {
    impact: StateImpact;
    results: BoutResult[];
    summary: WeekBoutSummary;
  }): BoutPassOutput => {
    // Attach the results to the state for telemetry
    const boutSummaries: FightSummary[] = results.map((r) => ({
    id: (r.contractId || generateId()) as FightId,
    week: state.week,
    absoluteWeek: state.absoluteWeek || state.week,
    title: `${r.a.name} vs ${r.d.name}`,
    warriorIdA: r.a.id,
    warriorIdD: r.d.id,
    winner: r.outcome.winner,
    by: r.outcome.by,
    styleA: r.a.style,
    styleD: r.d.style,
    flashyTags: r.outcome.post?.tags ?? [],
    fameDeltaA: 0,
    fameDeltaD: 0,
    fameA: r.a.fame,
    fameD: r.d.fame,
    popularityDeltaA: 0,
    popularityDeltaD: 0,
    transcript: r.outcome.log.map((e) => e.text),
    createdAt: gameYearWeekToTimestamp(state.year || 1, state.week),
  }));

    boutImpact.lastSimulationReport = {
      id: _rng.uuid() as SimulationReportId,
      week: state.week,
      absoluteWeek: state.absoluteWeek || state.week,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: boutSummaries,
    };

    return { impact: boutImpact, results, summary };
  };

  return boutOutput instanceof Promise ? boutOutput.then(finish) : finish(boutOutput);
}
