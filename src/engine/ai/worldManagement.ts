import type { GameState, RivalStableData } from '@/types/state.types';
import type { Warrior } from '@/types/warrior.types';
import type { StableId } from '@/types/shared.types';
import type { IRNGContext } from '@/engine/core/rng/IRNGContext';

// Import extracted modules
import { SeasonalRetirementService } from './seasonalRetirementService';
import { BankruptcyService } from './bankruptcyService';
import { ExpansionService, type MintedStable } from './expansionService';
import { BANKRUPTCY_PRESSURE_ABOVE_SOFT_CAP, WORLD_RIVAL_SOFT_CAP } from '@/constants/world';
import { BANKRUPTCY_THRESHOLD } from '@/constants/economy';

/**
 * Diff two rival rosters-of-the-world by membership: which stables were
 * removed, which were added, which survived. `removedRosters` carries the
 * displaced warriors so callers can route them to the recruit pool instead
 * of silently losing them.
 */
export function diffRivalMembership(
  prev: RivalStableData[],
  next: RivalStableData[]
): {
  removedIds: StableId[];
  additions: RivalStableData[];
  retained: RivalStableData[];
  removedRosters: Warrior[][];
} {
  const nextIds = new Set(next.map((r) => r.id));
  const prevIds = new Set(prev.map((r) => r.id));
  const removed = prev.filter((r) => !nextIds.has(r.id));
  return {
    removedIds: removed.map((r) => r.id),
    additions: next.filter((r) => !prevIds.has(r.id)),
    retained: next.filter((r) => prevIds.has(r.id)),
    removedRosters: removed.map((r) => r.roster),
  };
}

/** Gazette line for a newly minted stable, tagged by its origin. */
function mintedNews(m: MintedStable): string {
  switch (m.origin) {
    case 'legacy':
      return `🏆 LEGENDARY FOUNDER: ${m.stable.owner.name} has founded ${m.stable.owner.stableName}!`;
    case 'organic':
      return `🆕 RECRUITMENT: ${m.stable.owner.stableName} has been granted an arena license as a new Minor rival!`;
    default:
      return `🆕 RECRUITMENT: ${m.stable.owner.stableName} has been granted an arena license as a new Minor rival!`;
  }
}

/**
 * WorldManagementService - Orchestrates stable bankruptcy, world-wide retirement,
 * and the 'Legacy Founder' (retired warrior to owner) system.
 * Facade that delegates to extracted modules.
 */
export const WorldManagementService = {
  /**
   * Processes the seasonal 'Churn' (Bankruptcy, Retirement, Expansion).
   * Typically runs on Week 13/26/39/52.
   *
   * The legacy-founder queue lives on `state.legacyFounderQueue` — retirees
   * enqueue inside `processSeasonalRetirement`, and the expansion pass mints
   * up to EXPANSION_MAX_PER_CHURN of them (plus floor refill and organic
   * licensing) while returning the surviving queue.
   */
  processSeasonalChurn(
    state: GameState,
    rngContext: IRNGContext
  ): { updatedState: GameState; news: string[] } {
    let updatedState = { ...state };
    const news: string[] = [];

    // 1. Retirement — caliber retirees enqueue onto state.legacyFounderQueue.
    const rng = rngContext.getRNG();
    const { updatedState: retirementState } = SeasonalRetirementService.processSeasonalRetirement(
      updatedState,
      rng
    );
    updatedState = retirementState;

    // 2. Bankruptcy — pressure rises gently once the world overshoots the
    //    soft cap, so overpopulation ebbs through failures.
    const bankruptcyThreshold =
      (updatedState.rivals?.length ?? 0) > WORLD_RIVAL_SOFT_CAP
        ? Math.round(BANKRUPTCY_THRESHOLD * BANKRUPTCY_PRESSURE_ABOVE_SOFT_CAP)
        : undefined;
    const { updatedState: bankruptcyState, bankruptStables } = BankruptcyService.processBankruptcy(
      updatedState,
      rng,
      bankruptcyThreshold
    );
    updatedState = bankruptcyState;

    bankruptStables.forEach((stableName) => {
      news.push(`📉 COLLAPSE: ${stableName} has shuttered its doors due to financial insolvency.`);
    });

    // 3. Expansion — legacy founders first (additive to the hard cap), then
    //    floor refill, then organic licensing.
    const expansionRng = rngContext.createChild(100).getRNG();
    const { updatedState: expansionState, minted } = ExpansionService.processExpansion(
      updatedState,
      expansionRng
    );
    updatedState = expansionState;

    minted.forEach((m) => news.push(mintedNews(m)));

    return { updatedState, news };
  },
};
