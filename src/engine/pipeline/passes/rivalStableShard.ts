import type { GameState, RivalStableData, Warrior } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { updateAIStrategy, verifyIntentSkepticism } from '@/engine/ai/intentEngine';
import { logAgentAction } from '@/engine/ai/agentCore';
import { processAIStable } from '@/engine/ai/stableManager';
import { generateRivalStables } from '@/engine/rivals';
import { processIntel } from '@/engine/ai/workers/intelWorker';
import { processTournamentPrep } from '@/engine/ai/workers/tournamentWorker';
import { SeededRNGService } from '@/utils/random';
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
  // Audit trail: issuance is exactly updateAIStrategy's re-pick gate (no plan,
  // expired plan, or disproved plan). Recomputing the gate here beats inferring
  // issuance from planWeeksRemaining deltas, which can't distinguish a weekly
  // tick from a disproved plan being replaced by a shorter one.
  const planIssued =
    !rival.strategy ||
    rival.strategy.planWeeksRemaining <= 0 ||
    verifyIntentSkepticism(rival, state);
  const strategy = updateAIStrategy(rival, state, strategySeed);
  const rivalWithStrategy = planIssued
    ? logAgentAction(
        { ...rival, strategy },
        'STRATEGY',
        strategy.reason ?? `Adopted ${strategy.intent}`,
        'Low',
        state.week,
        strategy.intent
      )
    : { ...rival, strategy };

  // 🎂 1.0 Hardening: Handle Aging & Succession
  const { updatedRival: rivalWithLifecycle, gazetteItems: lifecycleGazette } =
    handleOwnerLifecycle(
      rivalWithStrategy,
      nextWeek,
      new SeededRNGService(strategySeed + 123),
      successorByStable,
      state.absoluteWeek + 1
    );
  gazetteItems.push(...lifecycleGazette);

  const { updatedRival: processedRival, isBankrupt, gazetteItems: stableGazette } =
    processAIStable(rivalWithLifecycle, state, perception);
  gazetteItems.push(...stableGazette);

  // D.5 — Intel worker: weekly seeded dossier refresh before planning.
  const intel = processIntel(processedRival, state, perception);
  gazetteItems.push(...intel.gazetteItems);

  // D.7 — Tournament worker: TOURNAMENT_CAMPAIGN rest-bias prep.
  const prep = processTournamentPrep(intel.updatedRival, nextWeek);
  gazetteItems.push(...prep.gazetteItems);
  const updatedRival = prep.updatedRival;

  if (isBankrupt) {
    const retirementSeed = state.absoluteWeek + index * 1000;
    const generated = generateRivalStables(1, retirementSeed);
    const newStable = generated[0];
    if (newStable) {
      gazetteItems.push(
        `🆕 RECRUITMENT: ${newStable.owner.stableName} has debuted in the league under ${newStable.owner.name}!`
      );
      return { rival: newStable as RivalStableData, gazetteItems };
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
