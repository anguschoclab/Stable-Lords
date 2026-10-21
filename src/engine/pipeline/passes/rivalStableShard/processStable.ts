import type { GameState, RivalStableData } from '@/types/state.types';
import { updateAIStrategy, verifyIntentSkepticism } from '@/engine/ai/intentEngine';
import { logAgentAction } from '@/engine/ai/agentCore';
import { processAIStable } from '@/engine/ai/stableManager';
import { processIntel } from '@/engine/ai/workers/intelWorker';
import { processTournamentPrep } from '@/engine/ai/workers/tournamentWorker';
import { processCrownPosture, assignCampaignRoles } from '@/engine/ai/workers/crownWorker';
import { applySeasonPlan } from '@/engine/ai/plan/seasonPlan';
import { SeededRNG } from '@/utils/random';
import { aiRosterMin } from '@/constants/ai';
import { handleOwnerLifecycle } from './lifecycle';
import { mintSuccessorStable } from './successorMint';
import type { RivalShardInput, RivalShardContext, RivalShardOutput } from './shardContract';

/**
 * Weekly strategy pick + audit trail. The issuance gate is exactly
 * updateAIStrategy's re-pick gate (no plan, expired plan, or disproved plan).
 * Recomputing the gate here beats inferring issuance from
 * planWeeksRemaining deltas, which can't distinguish a weekly tick from a
 * disproved plan being replaced by a shorter one.
 */
function applyStrategyUpdate(
  rival: RivalStableData,
  state: GameState,
  strategySeed: number
): RivalStableData {
  const planIssued =
    !rival.strategy ||
    rival.strategy.planWeeksRemaining <= 0 ||
    verifyIntentSkepticism(rival, state);
  const strategy = updateAIStrategy(rival, state, strategySeed);
  return planIssued
    ? logAgentAction({
        rival: { ...rival, strategy },
        type: 'STRATEGY',
        description: strategy.reason ?? `Adopted ${strategy.intent}`,
        riskTier: 'Low',
        week: state.week,
        cause: strategy.intent,
      })
    : { ...rival, strategy };
}

/**
 * Starvation bookkeeping: count consecutive weeks below the personality
 * roster minimum. The fold decision itself happens post-draft in
 * finishRivalPass (only the draft knows whether a recruit was affordable).
 */
function applyStarvationBookkeeping(rival: RivalStableData): RivalStableData {
  const activeNow = rival.roster.filter((w) => w.status === 'Active').length;
  const belowMin = activeNow < aiRosterMin(rival.owner.personality);
  if ((rival.weeksBelowMin ?? 0) === 0 && !belowMin) return rival;
  return {
    ...rival,
    weeksBelowMin: belowMin ? (rival.weeksBelowMin ?? 0) + 1 : 0,
  };
}

/**
 * Processes a single rival stable for the week: strategy update, owner
 * lifecycle, economy/strategy delegation, intel refresh, tournament prep, and
 * bankruptcy succession. Deterministic — every random draw derives from
 * `absoluteWeek` + `index` + owner id, so output is independent of which
 * shard (or thread) runs it.
 */
export function processRivalStable(
  input: RivalShardInput,
  ctx: RivalShardContext
): RivalShardOutput {
  const { rival, index } = input;
  const { state, perception, successorByStable, nextWeek } = ctx;
  const gazetteItems: string[] = [];

  const strategySeed = state.absoluteWeek * 31 + index * 997 + (rival.owner.id || '').length;
  // Season plan-of-record: tick or re-pick the objective BEFORE
  // the weekly intent pick so the cascade can service it.
  const rivalWithObjective = applySeasonPlan(rival, state);
  const rivalWithStrategy = applyStrategyUpdate(rivalWithObjective, state, strategySeed);

  // 🎂 1.0 Hardening: Handle Aging & Succession
  const { updatedRival: rivalWithLifecycle, gazetteItems: lifecycleGazette } = handleOwnerLifecycle(
    rivalWithStrategy,
    nextWeek,
    new SeededRNG(strategySeed + 123),
    successorByStable,
    state.absoluteWeek + 1
  );
  gazetteItems.push(...lifecycleGazette);

  // Crown posture: refresh the title assessment (read by next tick's intent
  // pick), flag relinquishments, and write rest markers BEFORE processAIStable
  // so the roster worker sees them and skips training the protected warriors.
  const crown = processCrownPosture(rivalWithLifecycle, state, perception);
  gazetteItems.push(...crown.gazetteItems);

  const {
    updatedRival: processedRival,
    isBankrupt,
    gazetteItems: stableGazette,
  } = processAIStable(crown.updatedRival, state, perception);
  gazetteItems.push(...stableGazette);

  // D.5 — Intel worker: weekly seeded dossier refresh before planning.
  const intel = processIntel(processedRival, state, perception);
  gazetteItems.push(...intel.gazetteItems);

  // D.7 — Tournament worker: TOURNAMENT_CAMPAIGN rest-bias prep.
  const prep = processTournamentPrep(intel.updatedRival, nextWeek);
  gazetteItems.push(...prep.gazetteItems);

  // D.8 — Campaign roles: stamp each warrior's campaignFocus with the shared
  // advisor semantics (incl. CROWN_BID for ladder-ranked contenders) so offer
  // evaluation, training, and bookings all read one role source.
  let updatedRival = assignCampaignRoles(prep.updatedRival, state, perception);
  updatedRival = applyStarvationBookkeeping(updatedRival);

  if (isBankrupt) {
    const replacement = mintSuccessorStable(state, index);
    if (replacement) {
      gazetteItems.push(
        `🆕 RECRUITMENT: ${replacement.owner.stableName} has debuted in the league under ${replacement.owner.name}!`
      );
      return { rival: replacement, gazetteItems, replacesStableId: rival.id };
    }
  }
  return { rival: updatedRival, gazetteItems };
}

/**
 * In-line shard executor — the default path and the semantic reference for
 * the distributed pool. Chunk order is preserved so merged output is
 * byte-identical to sequential execution.
 */
export function runRivalShardChunk(
  inputs: RivalShardInput[],
  ctx: RivalShardContext
): RivalShardOutput[] {
  return inputs.map((input) => processRivalStable(input, ctx));
}
