import { type RivalStableData, type PoolWarrior, type GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { processRecruitment } from '../ai/workers/recruitmentWorker';
import { computeMetaDrift, type StyleMeta } from '../analytics/metaDrift';
import { isActive, deadIdSet } from '@/engine/warrior/warriorStatus';
import { getStablePairKey } from '@/utils/keyUtils';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';

/**
 * Rivalry counter-meta (moved from processAIRosterManagement, G9): a rival
 * locked in a heated feud with the player drafts to counter the player's
 * observed style mix rather than the global meta.
 */
function rivalDraftMeta(
  rival: RivalStableData,
  state: GameState,
  meta: StyleMeta,
  rivalryMap: Map<string, (typeof state.rivalries)[number]>
): StyleMeta {
  const adaptation = rival.owner.metaAdaptation ?? 'Opportunist';
  // Rivalry entries key on stable ids; older fixtures may key on owner ids.
  const rivalry =
    rivalryMap.get(getStablePairKey(state.player.id, rival.id as string)) ??
    rivalryMap.get(getStablePairKey(state.player.id, rival.owner.id));
  if (!rivalry || rivalry.intensity < 3 || adaptation === 'Traditionalist') return meta;
  // Player-stable fights are resolved through the stable map — fight
  // summaries carry warrior ids, not the player's stable id.
  const playerFights = (state.arenaHistory ?? [])
    .filter(
      (f) =>
        state.warriorToStableMap?.get(f.warriorIdA)?.stableId === state.player.id ||
        state.warriorToStableMap?.get(f.warriorIdD)?.stableId === state.player.id
    )
    .slice(-10);
  return playerFights.length > 0 ? computeMetaDrift(playerFights, 10) : meta;
}

/**
 * 🐍 Snake Draft Priority: rotate the order by week so the same stables
 * don't always pick first, then need-sort (stable sort keeps the rotation
 * inside each need tier — fewest active warriors still pick first).
 */
function orderRivalsForSnakeDraft(rivals: RivalStableData[], week: number): RivalStableData[] {
  const rotated = [...rivals];
  if (rotated.length > 0) {
    const rot = week % rotated.length;
    rotated.push(...rotated.splice(0, rot));
  }
  return rotated.sort((a, b) => {
    const aActive = a.roster.filter((w) => isActive(w)).length;
    const bActive = b.roster.filter((w) => isActive(w)).length;
    if (aActive !== bActive) return aActive - bActive;
    return a.treasury - b.treasury;
  });
}

/**
 *
 */
export interface AiDraftFromPoolArgs {
  pool: PoolWarrior[];
  rivals: RivalStableData[];
  week: number;
  state: GameState;
  seed?: number;
  rng?: IRNGService;
}

/**
 * AI Draft Service
 * Refactored to delegate to isolated RecruitmentWorkers.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 * Sole recruitment path for AI stables (G9) — processAIRosterManagement
 * only flags `needsRecruit`.
 */
export function aiDraftFromPool(args: AiDraftFromPoolArgs): {
  updatedPool: PoolWarrior[];
  updatedFreeAgents: PoolWarrior[];
  updatedRivals: RivalStableData[];
  gazetteItems: string[];
} {
  const { pool, rivals, week, state, seed } = args;
  const { rng } = args;
  const rngService = resolveRng(rng, seed ?? (state.absoluteWeek ?? week) * 7919 + 101);
  const isMajorDraftWeek = week % 4 === 0;

  // One supply chain: free agents and the orphanage pool share the draft.
  // `source` tags survive the merge so the caller can split them back out.
  // Registered-dead ids can sit in either shelf as stale 'Active' snapshots —
  // they are filtered at intake so a dead identity is never re-drafted.
  const deadIds = deadIdSet(state);
  let currentPool = [...(state.freeAgents ?? []), ...pool].filter((w) => !deadIds.has(w.id));
  const globalGazetteItems: string[] = [];
  const usedNames = collectUsedWarriorNames(state);
  // Freshly minted warrior ids (draft signings, generated recruits) are
  // drawn from seeded streams — guard against cross-stream id collisions.
  const usedIds = collectUsedWarriorIds(state);

  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
  const rivalryMap = new Map(
    (state.rivalries || []).map((rv) => [getStablePairKey(rv.stableIdA, rv.stableIdB), rv])
  );

  const sortedRivals = orderRivalsForSnakeDraft(rivals, week);

  const draftResults: Record<string, RivalStableData> = {};

  for (const rival of sortedRivals) {
    const customMeta = rivalDraftMeta(rival, state, meta, rivalryMap);
    const { updatedRival, updatedPool, gazetteItems } = processRecruitment(
      { rival: rival, pool: currentPool, week: week, rng: rngService, isMajorDraftWeek: isMajorDraftWeek, meta: customMeta, usedNames: usedNames, usedIds: usedIds }
    );

    draftResults[updatedRival.owner.id] = updatedRival;
    currentPool = updatedPool;
    globalGazetteItems.push(...gazetteItems);
  }

  // Restore original rival order to maintain pipeline stability
  const finalizedRivals = rivals.map((r) => draftResults[r.owner.id] || r);

  // Split the merged candidate pool back into the free-agent shelf and the
  // orphanage pool — the `source` tag stamped at intake is the partition key.
  const updatedFreeAgents = currentPool.filter((w) => w.source === 'freeAgent' || w.veteran);
  const updatedPool = currentPool.filter((w) => w.source !== 'freeAgent' && !w.veteran);

  return {
    updatedPool,
    updatedFreeAgents,
    updatedRivals: finalizedRivals,
    gazetteItems: globalGazetteItems,
  };
}
