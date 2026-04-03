import { type RivalStableData, type PoolWarrior, type GameState } from "@/types/state.types";
import { SeededRNG } from "@/utils/random";
import { processRecruitment } from "./ai/workers/recruitmentWorker";
import { computeMetaDrift } from "./metaDrift";

/**
 * AI Draft Service
 * Refactored to delegate to isolated RecruitmentWorkers.
 * Implements "Context Isolation" and "Risk-Tiered Execution".
 */
export function aiDraftFromPool(
  pool: PoolWarrior[],
  rivals: RivalStableData[],
  week: number,
  state: GameState,
  seed?: number
): { updatedPool: PoolWarrior[]; updatedRivals: RivalStableData[]; gazetteItems: string[] } {
  const rng = new SeededRNG(seed ?? (week * 7919 + 101));
  const isMajorDraftWeek = week % 4 === 0;
  
  let currentPool = [...pool];
  const updatedRivals: RivalStableData[] = [];
  const globalGazetteItems: string[] = [];

  const meta = computeMetaDrift(state.arenaHistory || []);
  
  for (const rival of rivals) {
    const { updatedRival, updatedPool, gazetteItems } = processRecruitment(
      rival,
      currentPool,
      week,
      rng,
      isMajorDraftWeek,
      meta
    );
    
    updatedRivals.push(updatedRival);
    currentPool = updatedPool;
    globalGazetteItems.push(...gazetteItems);
  }

  return { 
    updatedPool: currentPool, 
    updatedRivals, 
    gazetteItems: globalGazetteItems 
  };
}
