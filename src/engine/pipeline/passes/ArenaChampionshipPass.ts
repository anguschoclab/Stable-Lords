/**
 * Stable Lords — Arena Championship Pass
 *
 * Runs in the world stage (after rankings): maintains every arena's title
 * lifecycle — vacancies, title-bout results, refusals/stripping, dormancy and
 * re-engagement, defense scheduling, and the champion trickle.
 *
 * Internal order is load-bearing and tested:
 *   seed → vacancies → results → refusal sweep → lifecycle → scheduling → perks
 *   → grand-champion recording (independent award step — last)
 */
import type { GameState, BoutOffer } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import type { StateImpact } from '@/engine/impacts';
import type { WeekPipelineContext } from '@/engine/pipeline/pipelineStages';
import {
  createChampionshipDelta,
  seedChampions,
  enforceVacancies,
  resolveTitleBoutResults,
  sweepTitleRefusals,
  applyLifecycleTransitions,
  scheduleTitleBouts,
  applyChampionPerks,
  recordGrandChampions,
} from '@/engine/championship/arenaChampionship';

/**
 * Run the arena championship pass.
 */
export function runArenaChampionshipPass(state: GameState, ctx: WeekPipelineContext): StateImpact {
  const delta = createChampionshipDelta();

  seedChampions(state, delta);
  enforceVacancies(state, delta);
  resolveTitleBoutResults(state, delta);
  sweepTitleRefusals(state, delta);
  applyLifecycleTransitions(state, delta);
  scheduleTitleBouts(state, delta, ctx.rootRng);
  applyChampionPerks(state, delta);
  recordGrandChampions(state, delta);

  const impact: StateImpact = {};
  if (Object.keys(delta.arenaChampions).length > 0) {
    impact.arenaChampions = delta.arenaChampions;
  }
  if (delta.grandChampions.length > 0) impact.grandChampions = delta.grandChampions;
  if (delta.treasuryDelta !== 0) impact.treasuryDelta = delta.treasuryDelta;

  // boutOffers dictMerge — new title offers + cancellations share one keyspace.
  const boutOffers: Record<BoutOfferId, BoutOffer> = {};
  for (const o of Object.values(delta.canceledOffers)) boutOffers[o.id] = o;
  for (const o of delta.newOffers) boutOffers[o.id] = o;
  if (Object.keys(boutOffers).length > 0) impact.boutOffers = boutOffers;

  if (delta.newsletterItems.length > 0) impact.newsletterItems = delta.newsletterItems;
  if (delta.rosterUpdates.size > 0) impact.rosterUpdates = delta.rosterUpdates;
  if (delta.rivalsUpdates.size > 0) impact.rivalsUpdates = delta.rivalsUpdates;

  return impact;
}
