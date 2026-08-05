/**
 * Bout processor service — week bout orchestration.
 * Types extracted to boutProcessorTypes.ts, resolution logic to boutResolution.ts.
 * Re-exports for backward compatibility.
 */
import { GameState } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import { getMoodModifiers } from '@/engine/crowdMood';
import { StateImpact, mergeImpacts } from '@/engine/impacts';
import { generatePairings } from '../core/pairings';
import { finalizeWeekSideEffectsToImpact } from './WeekFinalizationService';
import { accumulateWeekStats, createWeekBoutSummary } from './WeekStatsService';
import { buildActiveWarriorMap } from '@/utils/roster';
import { isFightReady } from '@/engine/warriorStatus';
import { resolveBout } from './boutResolution';
import type { BoutResult, WeekBoutSummary } from './boutProcessorTypes';

// Re-export types and resolveBout for backward compatibility
export type { BoutResult, BoutImpact, WeekBoutSummary, BoutContext } from './boutProcessorTypes';
export { resolveBout } from './boutResolution';

/**
 * Process week bouts.
 */
export function processWeekBouts(
  state: GameState,
  headless?: boolean
): {
  impact: StateImpact;
  results: BoutResult[];
  summary: WeekBoutSummary;
} {
  const warriorMap = state.warriorMap || buildActiveWarriorMap(state);

  // Minimum Viable Arena: skip combat phase if fewer than 2 eligible warriors
  // exist across all stables. Economy, training, and aging still proceed.
  let eligibleCount = 0;
  for (const w of warriorMap.values()) {
    if (isFightReady(w, state.isTournamentWeek)) eligibleCount++;
  }
  if (eligibleCount < 2) {
    const summary = createWeekBoutSummary();
    const quietImpact = finalizeWeekSideEffectsToImpact(state, []);
    return { impact: quietImpact, results: [], summary };
  }

  const moodMods = getMoodModifiers(state.crowdMood);
  const impacts: StateImpact[] = [];
  const results: BoutResult[] = [];
  const summary = createWeekBoutSummary();

  const pairings = generatePairings(state);

  pairings.forEach((p) => {
    const contract = p.contractId ? state.boutOffers[p.contractId as BoutOfferId] : undefined;
    // Tournament bouts have synthetic contractIds starting with 'tour_'
    const isTournamentBout = p.contractId?.startsWith('tour_') ?? false;
    const res = resolveBout(state, {
      warrior: p.a,
      opponent: p.d,
      isRivalry: p.isRivalry,
      rivalStable: p.rivalStable,
      rivalStableId: p.rivalStableId,
      moodMods,
      week: state.absoluteWeek,
      displayWeek: state.week,
      playerId: state.player.id,
      warriorMap,
      contract,
      headless,
      isTournamentBout,
    });
    impacts.push(res.impact);
    results.push(res.result);
    accumulateWeekStats(summary, res);
  });

  impacts.push(finalizeWeekSideEffectsToImpact(state, results));
  return { impact: mergeImpacts(impacts), results, summary };
}
