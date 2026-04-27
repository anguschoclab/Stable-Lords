import type { GameState } from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { FightId, SimulationReportId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { processWeekBouts } from '@/engine/bout/services/boutProcessorService';
import { generateId } from '@/utils/idUtils';
import { StateImpact } from '@/engine/impacts';
import { planWeeklyMatches } from '@/engine/weeklyMatchmaking';
import { getFeatureFlags } from '@/engine/featureFlags';

/**
 * Stable Lords — Bout Simulation Pipeline Pass
 * Integrates the legacy bout processor into the standard modular pipeline.
 */
export function runBoutSimulationPass(state: GameState, _rng: IRNGService): StateImpact {
  // Weekly-matchmaker orchestrator — gated behind a feature flag. When off
  // (default), planWeeklyMatches returns an empty plan with reason
  // `feature_flag_off` and processWeekBouts runs exactly as before. When
  // the flag flips on, the plan's reason codes flow into telemetry for
  // dashboards and future scheduler consumers; we still fall through to
  // processWeekBouts so bouts resolve through the canonical path.
  const flags = getFeatureFlags();
  if (flags.weeklyMatchmaker && _rng) {
    const plan = planWeeklyMatches(state, _rng);
    if (plan.reasons.length > 0 && typeof console !== 'undefined' && console.debug) {
      console.debug('[weeklyMatchmaker]', { week: state.week, ...plan });
    }
  }

  // Although processWeekBouts uses its own deterministic seeds via hashStr,
  // we wrap it here to maintain pipeline consistency for the 1.0 release.
  const { impact: boutImpact, results } = processWeekBouts(state);

  // Attach the results to the state for telemetry
  const boutSummaries: FightSummary[] = results.map((r) => ({
    id: (r.contractId || generateId()) as FightId,
    week: state.week,
    title: `${r.a.name} vs ${r.d.name}`,
    a: r.a.name,
    d: r.d.name,
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
    createdAt: new Date().toISOString(),
  }));

  boutImpact.lastSimulationReport = {
    id: _rng.uuid() as SimulationReportId,
    week: state.week,
    treasuryChange: 0,
    trainingGains: [],
    agingEvents: [],
    healthEvents: [],
    ...state.lastSimulationReport,
    bouts: boutSummaries,
  };

  return boutImpact;
}
