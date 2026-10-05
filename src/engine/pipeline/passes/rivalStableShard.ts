import type { GameState, RivalStableData, Warrior } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { updateAIStrategy, verifyIntentSkepticism } from '@/engine/ai/intentEngine';
import { logAgentAction } from '@/engine/ai/agentCore';
import { processAIStable } from '@/engine/ai/stableManager';
import { generateRivalStables, uniqueOwnerName, uniqueStableName } from '@/engine/rivals';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { processIntel } from '@/engine/ai/workers/intelWorker';
import { processTournamentPrep } from '@/engine/ai/workers/tournamentWorker';
import { processCrownPosture, assignCampaignRoles } from '@/engine/ai/workers/crownWorker';
import { driftCompetence } from '@/engine/ai/competence';
import { applySeasonPlan } from '@/engine/ai/plan/seasonPlan';
import { SeededRNGService } from '@/utils/random';
import { aiRosterMin } from '@/constants/ai';
import type { PerceptionSnapshot } from '@/engine/ai/memory/perceptionSnapshot';

/**
 * Builds an index mapping stableId → first famous retired warrior (fame > 200).
 * Replaces per-rival O(N) find() scans with O(1) map lookups.
 */
export function buildSuccessorIndex(retired: Warrior[] | undefined): Map<StableId, Warrior> {
  const index = new Map<StableId, Warrior>();
  for (const w of retired || []) {
    if ((w.fame || 0) > 200 && w.stableId && !index.has(w.stableId)) {
      index.set(w.stableId, w);
    }
  }
  return index;
}

/**
 * 🎂 Owner Lifecycle: Handles annual aging and generational succession.
 */
export function handleOwnerLifecycle(
  rival: RivalStableData,
  nextWeek: number,
  rng: IRNGService,
  successorByStable: Map<StableId, Warrior>,
  absoluteWeek?: number
): { updatedRival: RivalStableData; gazetteItems: string[] } {
  const updatedRival = { ...rival, owner: { ...rival.owner } };
  const gazetteItems: string[] = [];

  // 1. Annual Aging (Occurs on Week 1)
  if (nextWeek === 1) {
    updatedRival.owner.age = (updatedRival.owner.age || 40) + 1;
  }

  // 2. Succession Logic (Starts at age 65, becomes likely by 75)
  const age = updatedRival.owner.age || 40;
  const retirementChance = age < 65 ? 0 : age < 75 ? 0.05 : 0.2;

  if (rng.next() < retirementChance) {
    const generation = (updatedRival.owner.generation || 0) + 1;
    const oldName = updatedRival.owner.name;

    // 🏆 Successor Hunt: O(1) lookup via pre-built index
    const successorCandidate = successorByStable.get(updatedRival.id);

    const newName = successorCandidate
      ? successorCandidate.name
      : `Lord ${updatedRival.owner.stableName.split(' ')[0]} ${'I'.repeat(generation + 1)}`;

    updatedRival.owner = {
      ...updatedRival.owner,
      name: newName,
      age: 25 + Math.floor(rng.next() * 15),
      generation,
      fame: Math.floor(updatedRival.owner.fame * 0.4), // Fame reset on new leadership
      backstoryId: undefined, // Fresh start
      ageRetired: absoluteWeek ?? nextWeek, // Week the previous owner retired
      competence: driftCompetence(rival.owner.competence, rng),
    };

    gazetteItems.push(
      `👑 SUCCESSION: ${oldName} has retired from ${updatedRival.owner.stableName}. ${newName} takes the mantle (Generation ${generation})!`
    );
  }

  return { updatedRival, gazetteItems };
}

/**
 * Shared, read-only context every rival shard sees. Must be treated as
 * immutable — shard workers receive a structured clone, so any mutation here
 * would silently diverge between in-line and distributed execution.
 */
export interface RivalShardContext {
  state: GameState;
  perception: PerceptionSnapshot;
  successorByStable: Map<StableId, Warrior>;
  nextWeek: number;
}

/**
 * Per-shard work item: one rival stable plus its deterministic position in
 * the week's rival ordering. `index` feeds the strategy seed, so it must be
 * stable across sequential and distributed execution.
 */
export interface RivalShardInput {
  rival: RivalStableData;
  index: number;
}

/**
 * Result of processing one rival stable for the week: the updated stable
 * (or its bankruptcy replacement) and any gazette lines it produced.
 */
export interface RivalShardOutput {
  rival: RivalStableData;
  gazetteItems: string[];
  /** Set when `rival` is a bankruptcy successor: the id of the stable it replaces. */
  replacesStableId?: RivalStableData['id'];
}

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
    ? logAgentAction(
        { rival: { ...rival, strategy }, type: 'STRATEGY', description: strategy.reason ?? `Adopted ${strategy.intent}`, riskTier: 'Low', week: state.week, cause: strategy.intent }
      )
    : { ...rival, strategy };
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
  // Season plan-of-record (Stage C): tick or re-pick the objective BEFORE
  // the weekly intent pick so the cascade can service it.
  const rivalWithObjective = applySeasonPlan(rival, state);
  const rivalWithStrategy = applyStrategyUpdate(rivalWithObjective, state, strategySeed);

  // 🎂 1.0 Hardening: Handle Aging & Succession
  const { updatedRival: rivalWithLifecycle, gazetteItems: lifecycleGazette } = handleOwnerLifecycle(
    rivalWithStrategy,
    nextWeek,
    new SeededRNGService(strategySeed + 123),
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

  // Starvation bookkeeping: count consecutive weeks below the personality
  // roster minimum. The fold decision itself happens post-draft in
  // finishRivalPass (only the draft knows whether a recruit was affordable).
  const activeNow = updatedRival.roster.filter((w) => w.status === 'Active').length;
  const belowMin = activeNow < aiRosterMin(updatedRival.owner.personality);
  if ((updatedRival.weeksBelowMin ?? 0) > 0 || belowMin) {
    updatedRival = {
      ...updatedRival,
      weeksBelowMin: belowMin ? (updatedRival.weeksBelowMin ?? 0) + 1 : 0,
    };
  }

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
 * Mint a bankruptcy-replacement stable. Seeds overlap across generation call
 * sites — a colliding seed re-mints a byte-identical clone of a live stable
 * (same stableId + warrior ids), conflating every id-keyed update. Re-seed
 * until the minted stable id and all warrior ids are world-unique.
 */
function mintSuccessorStable(state: GameState, index: number): RivalStableData | undefined {
  const usedStableIds = new Set((state.rivals ?? []).map((r) => r.id));
  const usedWarriorIds = collectUsedWarriorIds(state);
  const usedNames = collectUsedWarriorNames(state);
  const usedStableNames = new Set((state.rivals ?? []).map((r) => r.owner.stableName));
  const usedOwnerNames = new Set((state.rivals ?? []).map((r) => r.owner.name));
  if (state.player) {
    usedStableNames.add(state.player.stableName);
    usedOwnerNames.add(state.player.name);
  }
  const retirementSeed = state.absoluteWeek + index * 1000;
  for (let attempt = 0; attempt < 8; attempt++) {
    const newStable = generateRivalStables(1, retirementSeed + attempt * 7919, 0, usedNames)[0];
    if (!newStable) return undefined;
    if (usedStableIds.has(newStable.id) || newStable.roster.some((w) => usedWarriorIds.has(w.id))) {
      continue;
    }
    // Shards share a pre-pass snapshot — same-week mints can't see each
    // other, so `index` shifts the suffix scan to spread collisions.
    const suffixAt = 2 + index;
    return {
      ...newStable,
      owner: {
        ...newStable.owner,
        stableName: uniqueStableName(newStable.owner.stableName, usedStableNames, suffixAt),
        name: uniqueOwnerName(newStable.owner.name, usedOwnerNames, suffixAt),
      },
      establishedAbsoluteWeek: state.absoluteWeek,
    } as RivalStableData;
  }
  return undefined;
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
