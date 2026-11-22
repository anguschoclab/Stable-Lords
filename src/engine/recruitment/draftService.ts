import {
  type RivalStableData,
  type PoolWarrior,
  type GameState,
  type Rivalry,
} from '@/types/state.types';
import type { FightSummary } from '@/types/combat.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { processRecruitment } from '../ai/workers/recruitmentWorker';
import { computeMetaDrift, type StyleMeta } from '../analytics/metaDrift';
import { isActive, deadIdSet } from '@/engine/warrior/warriorStatus';
import { getPairKey } from '@/utils/keyUtils';
import { collectUsedWarriorIds, collectUsedWarriorNames } from '@/engine/core/warriorCollection';

/**
 * Rivalry counter-meta (moved from processAIRosterManagement): a rival
 * locked in a heated feud with the player drafts to counter the player's
 * observed style mix rather than the global meta.
 */
function rivalDraftMeta(
  rival: RivalStableData,
  playerId: string,
  meta: StyleMeta,
  rivalryMap: Map<string, Rivalry>,
  playerFights: FightSummary[]
): StyleMeta {
  const adaptation = rival.owner.metaAdaptation ?? 'Opportunist';
  // Rivalry entries key on stable ids; older fixtures may key on owner ids.
  const rivalry =
    rivalryMap.get(getPairKey(playerId, rival.id as string)) ??
    rivalryMap.get(getPairKey(playerId, rival.owner.id));
  if (!rivalry || rivalry.intensity < 3 || adaptation === 'Traditionalist') return meta;
  return playerFights.length > 0 ? computeMetaDrift(playerFights, 10) : meta;
}

/**
 * Last 10 arenaHistory fights involving a player warrior — the counter-meta
 * window. Rival-invariant, so aiDraftFromPool resolves it once for the whole
 * draft loop instead of per heated rival. The membership test mirrors
 * resolveWarriorOwner's isPlayer answer exactly (a warriorToStableMap hit
 * wins; a miss falls back to the live roster scan) without paying an
 * O(all-rosters) resolver call per fight — the week pipeline strips
 * warriorToStableMap before this pass runs.
 */
function lastPlayerFights(state: GameState): FightSummary[] {
  const rosterIds = new Set((state.roster ?? []).map((w) => w.id as string));
  const wts = state.warriorToStableMap;
  const isPlayerSide = (id: string): boolean =>
    wts?.has(id) === true ? wts.get(id)?.isPlayer === true : rosterIds.has(id);
  const playerFights: FightSummary[] = [];
  const history = state.arenaHistory ?? [];
  for (let i = history.length - 1; i >= 0 && playerFights.length < 10; i--) {
    const f = history[i];
    if (f && (isPlayerSide(f.warriorIdA) || isPlayerSide(f.warriorIdD))) playerFights.push(f);
  }
  playerFights.reverse();
  return playerFights;
}

/**
 * 🐍 Snake Draft Priority: rotate the order by week so the same stables
 * don't always pick first, then need-sort (stable sort keeps the rotation
 * inside each need tier — fewest active warriors still pick first).
 */
export function orderRivalsForSnakeDraft(
  rivals: RivalStableData[],
  week: number
): RivalStableData[] {
  const rotated = [...rivals];
  if (rotated.length > 0) {
    const rot = week % rotated.length;
    rotated.push(...rotated.splice(0, rot));
  }
  // Active counts once per stable — the comparator can't rescan rosters
  // O(log n) times each.
  const activeCounts = new Map(rotated.map((r) => [r.id, r.roster.filter(isActive).length]));
  return rotated.sort((a, b) => {
    const aActive = activeCounts.get(a.id) ?? 0;
    const bActive = activeCounts.get(b.id) ?? 0;
    if (aActive !== bActive) return aActive - bActive;
    return a.treasury - b.treasury;
  });
}

interface AiDraftFromPoolArgs {
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
 * Sole recruitment path for AI stables — processAIRosterManagement
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
    (state.rivalries || []).map((rv) => [getPairKey(rv.stableIdA, rv.stableIdB), rv])
  );

  const playerFights = lastPlayerFights(state);

  const sortedRivals = orderRivalsForSnakeDraft(rivals, week);

  const draftResults: Record<string, RivalStableData> = {};

  for (const rival of sortedRivals) {
    const customMeta = rivalDraftMeta(rival, state.player.id, meta, rivalryMap, playerFights);
    const { updatedRival, updatedPool, gazetteItems } = processRecruitment({
      rival: rival,
      pool: currentPool,
      week: week,
      rng: rngService,
      isMajorDraftWeek: isMajorDraftWeek,
      meta: customMeta,
      usedNames: usedNames,
      usedIds: usedIds,
      deadIds: deadIds,
    });

    draftResults[updatedRival.owner.id] = updatedRival;
    currentPool = updatedPool;
    globalGazetteItems.push(...gazetteItems);
  }

  // Restore original rival order to maintain pipeline stability
  const finalizedRivals = rivals.map((r) => draftResults[r.owner.id] || r);

  // Split the merged candidate pool back into the free-agent shelf and the
  // orphanage pool — the `source` tag stamped at intake is the partition key.
  // 'released' entries (player-initiated releases) recirculate on the
  // free-agent shelf alongside displaced veterans.
  const isShelfEntry = (w: PoolWarrior) =>
    w.source === 'freeAgent' || w.source === 'released' || !!w.veteran;
  const updatedFreeAgents = currentPool.filter(isShelfEntry);
  const updatedPool = currentPool.filter((w) => !isShelfEntry(w));

  return {
    updatedPool,
    updatedFreeAgents,
    updatedRivals: finalizedRivals,
    gazetteItems: globalGazetteItems,
  };
}
