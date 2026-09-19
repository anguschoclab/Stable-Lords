import { type RivalStableData, type PoolWarrior, type GameState } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { processRecruitment } from './ai/workers/recruitmentWorker';
import { computeMetaDrift } from './metaDrift';
import { isActive } from '@/engine/warriorStatus';
import { getStablePairKey } from '@/utils/keyUtils';

/**
 * AI Draft Service
 * Refactored to delegate to isolated RecruitmentWorkers.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 * Sole recruitment path for AI stables (G9) — processAIRosterManagement
 * only flags `needsRecruit`.
 */
export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number,
  state: GameState,
  seed?: number,
  rng?: IRNGService
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rngService = resolveRng(rng, seed ?? week * 7919 + 101);
  const isMajorDraftWeek = week % 4 === 0;

  let currentPool = [...pool];
  const globalGazetteItems: string[] = [];

  const meta = state.cachedMetaDrift || computeMetaDrift(state.arenaHistory || []);
  const rivalryMap = new Map(
    (state.rivalries || []).map((rv) => [getStablePairKey(rv.stableIdA, rv.stableIdB), rv])
  );

  // 🐍 Snake Draft Priority: Sort rivals by "Need"
  // Priority 1: Fewest active warriors
  // Priority 2: Lowest treasury
  const sortedRivals = [...rivals].sort((a, b) => {
    const aActive = a.roster.filter((w) => isActive(w)).length;
    const bActive = b.roster.filter((w) => isActive(w)).length;
    if (aActive !== bActive) return aActive - bActive;
    return a.treasury - b.treasury;
  });

  const draftResults: Record<string, RivalStableData> = {};

  for (const rival of sortedRivals) {
    // Rivalry counter-meta (moved from processAIRosterManagement, G9): a rival
    // locked in a heated feud with the player drafts to counter the player's
    // observed style mix rather than the global meta.
    let customMeta = meta;
    const adaptation = rival.owner.metaAdaptation ?? 'Opportunist';
    // Rivalry entries key on stable ids; older fixtures may key on owner ids.
    const rivalry =
      rivalryMap.get(getStablePairKey(state.player.id, rival.id as string)) ??
      rivalryMap.get(getStablePairKey(state.player.id, rival.owner.id));
    if (rivalry && rivalry.intensity >= 3 && adaptation !== 'Traditionalist') {
      // Player-stable fights are resolved through the stable map — fight
      // summaries carry warrior ids, not the player's stable id.
      const playerFights = (state.arenaHistory ?? [])
        .filter(
          (f) =>
            state.warriorToStableMap?.get(f.warriorIdA)?.stableId === state.player.id ||
            state.warriorToStableMap?.get(f.warriorIdD)?.stableId === state.player.id
        )
        .slice(-10);
      if (playerFights.length > 0) customMeta = computeMetaDrift(playerFights, 10);
    }

    const { updatedRival, updatedPool, gazetteItems } = processRecruitment(
      rival,
      currentPool,
      week,
      rngService,
      isMajorDraftWeek,
      customMeta
    );

    draftResults[updatedRival.owner.id] = updatedRival;
    currentPool = updatedPool;
    globalGazetteItems.push(...gazetteItems);
  }

  // Restore original rival order to maintain pipeline stability
  const finalizedRivals = rivals.map((r) => draftResults[r.owner.id] || r);

  return {
    updatedPool: currentPool,
    updatedRivals: finalizedRivals,
    gazetteItems: globalGazetteItems,
  };
}
