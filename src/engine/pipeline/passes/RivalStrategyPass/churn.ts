import { GameState, RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';
import { aiDraftFromPool } from '@/engine/recruitment/draftService';
import { warriorToPoolWarrior, type PoolWarrior } from '@/engine/recruitment/recruitment';
import { SeededRNG } from '@/utils/random';
import { StateImpact } from '@/engine/impacts';
import { checkBudget } from '@/engine/ai/workers/budgetWorker';
import { AI_GENERATED_RECRUIT_COST } from '@/constants/ai';
import {
  STABLE_STARVATION_WEEKS,
  WORLD_RIVAL_FLOOR,
  EXPANSION_MINT_ATTEMPTS,
} from '@/constants/world';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';
import { deadIdSet } from '@/engine/warrior/warriorStatus';
import type { RivalShardOutput } from '../rivalStableShard';
import { generateRivalStables, uniqueOwnerName, uniqueStableName } from '@/engine/rivals';

/**
 * Bankruptcy successors carry a new id, which rivalsUpdates can't reach —
 * swap them in explicitly or the bankrupt stable lingers as a ghost.
 *
 * Same-week successors mint against the pre-pass snapshot, so two folds can
 * debut identical names. Re-suffix at merge time — declaration order is the
 * deterministic tiebreaker, and both the in-line and pooled shard paths
 * converge here.
 */
export function successorReplacements(
  shardOutputs: RivalShardOutput[],
  state: GameState
): StateImpact[] {
  const liveStableNames = new Set((state.rivals ?? []).map((r) => r.owner.stableName));
  const liveOwnerNames = new Set((state.rivals ?? []).map((r) => r.owner.name));
  if (state.player) {
    liveStableNames.add(state.player.stableName);
    liveOwnerNames.add(state.player.name);
  }
  const rivalReplacements = new Map<StableId, RivalStableData>();
  for (const o of shardOutputs) {
    if (!o.replacesStableId) continue;
    const stableName = uniqueStableName(o.rival.owner.stableName, liveStableNames);
    const ownerName = uniqueOwnerName(o.rival.owner.name, liveOwnerNames);
    if (stableName !== o.rival.owner.stableName || ownerName !== o.rival.owner.name) {
      o.rival = { ...o.rival, owner: { ...o.rival.owner, stableName, name: ownerName } };
    }
    liveStableNames.add(stableName);
    liveOwnerNames.add(ownerName);
    rivalReplacements.set(o.replacesStableId, o.rival);
  }
  return rivalReplacements.size > 0 ? [{ rivalReplacements }] : [];
}

/**
 * Warriors of stables dissolved by this tick's bankruptcy swap re-enter the
 * world as free-agent recruits instead of silently vanishing (Dead and
 * Retired warriors keep their existing destinations).
 */
function collectFreedRecruits(
  shardOutputs: RivalShardOutput[],
  state: GameState,
  nextWeek: number
): PoolWarrior[] {
  const rng = new SeededRNG(state.absoluteWeek * 31 + 101);
  const deadIds = deadIdSet(state);
  const rivalsById = new Map((state.rivals ?? []).map((r) => [r.id, r] as const));
  const freed: PoolWarrior[] = [];
  for (const o of shardOutputs) {
    if (!o.replacesStableId) continue;
    const dissolved = rivalsById.get(o.replacesStableId);
    for (const w of dissolved?.roster ?? []) {
      if (w.status === 'Active' && !deadIds.has(w.id))
        freed.push(warriorToPoolWarrior(w, nextWeek, rng));
    }
  }
  return freed;
}

/** Active warriors of starvation-folded stables re-enter as free agents. */
function collectStarvedRecruits(
  folded: RivalStableData[],
  nextWeek: number,
  state: GameState
): PoolWarrior[] {
  const rng = new SeededRNG(nextWeek * 131 + 17);
  const deadIds = deadIdSet(state);
  const freed: PoolWarrior[] = [];
  for (const r of folded) {
    for (const w of r.roster) {
      if (w.status === 'Active' && !deadIds.has(w.id))
        freed.push(warriorToPoolWarrior(w, nextWeek, rng));
    }
  }
  return freed;
}

interface RunStarvationAndFreeAgentsArgs {
  currentRivals: RivalStableData[];
  shardOutputs: RivalShardOutput[];
  draft: ReturnType<typeof aiDraftFromPool>;
  state: GameState;
  nextWeek: number;
  globalGazetteItems: string[];
  impacts: StateImpact[];
}

/**
 * Starvation fold + free-agent reconciliation. A stable that has sat below
 * its roster minimum for STABLE_STARVATION_WEEKS and still can't afford even
 * the cheapest recruit collapses — its warriors reach the free-agent list.
 * Deltas, never a replace: the system pass's seasonal churn appends displaced
 * veterans in this same stage snapshot.
 */
export function runStarvationAndFreeAgents(
  args: RunStarvationAndFreeAgentsArgs
): RivalStableData[] {
  const { shardOutputs, draft, state, nextWeek } = args;
  let { currentRivals } = args;
  const { globalGazetteItems, impacts } = args;
  const folded: RivalStableData[] = [];
  currentRivals = currentRivals.filter((r) => {
    if ((r.weeksBelowMin ?? 0) < STABLE_STARVATION_WEEKS) return true;
    if (!checkBudget(r, AI_GENERATED_RECRUIT_COST, 'ROSTER').isAffordable) {
      folded.push(r);
      globalGazetteItems.push(
        `💀 COLLAPSE: ${r.owner.stableName} has folded — ${r.owner.name} could no longer field a roster.`
      );
      return false;
    }
    return true;
  });
  if (folded.length > 0) {
    impacts.push({ rivalsRemovals: folded.map((r) => r.id as StableId) });
  }

  impacts.push({
    recruitPool: draft.updatedPool ?? state.recruitPool ?? [],
  });
  const draftedOut = (state.freeAgents ?? [])
    .filter((w) => !(draft.updatedFreeAgents ?? []).some((u) => u.id === w.id))
    .map((w) => w.id);
  if (draftedOut.length > 0) impacts.push({ freeAgentRemovals: draftedOut });
  const freed = [
    ...collectFreedRecruits(shardOutputs, state, nextWeek),
    ...collectStarvedRecruits(folded, nextWeek, state),
  ];
  if (freed.length > 0) impacts.push({ freeAgentAdditions: freed });
  return currentRivals;
}

/**
 * Weekly world-floor refill. The seasonal churn's `refillToFloor` only runs
 * quarterly, so starvation folds and dropped bankruptcy swaps can strand the
 * world under WORLD_RIVAL_FLOOR for up to 13 weeks. Mint replacements at the
 * merge seam — this is the only point that sees the post-fold roster — so
 * every removal path leaves the world at or above the floor the same week.
 */
export function mintFloorRefill(
  state: GameState,
  currentRivals: RivalStableData[],
  nextWeek: number
): RivalStableData[] {
  const deficit = WORLD_RIVAL_FLOOR - currentRivals.length;
  if (deficit <= 0) return [];

  const postFoldState = { ...state, rivals: currentRivals };
  const usedStableIds = new Set(currentRivals.map((r) => r.id));
  const usedWarriorIds = collectUsedWarriorIds(postFoldState);
  const usedWarriorNames = collectUsedWarriorNames(postFoldState);
  const liveStableNames = new Set(currentRivals.map((r) => r.owner.stableName));
  const liveOwnerNames = new Set(currentRivals.map((r) => r.owner.name));
  if (state.player) {
    liveStableNames.add(state.player.stableName);
    liveOwnerNames.add(state.player.name);
  }

  const minted: RivalStableData[] = [];
  for (let i = 0; i < deficit; i++) {
    for (let attempt = 0; attempt < EXPANSION_MINT_ATTEMPTS; attempt++) {
      const seed = state.absoluteWeek * 6151 + i * 100003 + attempt * 7919;
      const stable = generateRivalStables(1, seed, nextWeek, usedWarriorNames)[0];
      if (!stable) break;
      if (usedStableIds.has(stable.id) || stable.roster.some((w) => usedWarriorIds.has(w.id))) {
        continue;
      }
      const stamped = {
        ...stable,
        owner: {
          ...stable.owner,
          stableName: uniqueStableName(stable.owner.stableName, liveStableNames),
          name: uniqueOwnerName(stable.owner.name, liveOwnerNames),
        },
        establishedAbsoluteWeek: state.absoluteWeek,
      } as RivalStableData;
      minted.push(stamped);
      usedStableIds.add(stable.id);
      liveStableNames.add(stamped.owner.stableName);
      liveOwnerNames.add(stamped.owner.name);
      for (const w of stable.roster) {
        usedWarriorIds.add(w.id);
        usedWarriorNames.add(w.name);
      }
      break;
    }
  }
  return minted;
}
