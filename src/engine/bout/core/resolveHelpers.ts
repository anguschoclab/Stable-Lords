import { GameState, Warrior, BoutOffer } from '@/types/state.types';
import type { StableId, FightId } from '@/types/shared.types';
import { StateImpact } from '@/engine/impacts';
import { getMoodModifiers } from '@/engine/crowdMood';
import { FightOutcome } from '@/types/combat.types';
import { fameFromTags } from '@/engine/fame';
import { isActive } from '@/engine/warriorStatus';

/**
 * Validate bout combatants.
 * @param currentW - Current w. (optional)
 * @param currentO - Current o. (optional)
 */
export function validateBoutCombatants(currentW?: Warrior, currentO?: Warrior): boolean {
  return !!currentW && isActive(currentW) && !!currentO;
}

/**
 * Get winner id.
 */
export function getWinnerId(outcome: FightOutcome, wId: string, oId: string): string | null {
  if (outcome.winner === 'A') return wId;
  if (outcome.winner === 'D') return oId;
  return null;
}

/**
 * Calculate bout fame.
 */
export function calculateBoutFame(
  outcome: FightOutcome,
  tags: string[],
  moodMods: ReturnType<typeof getMoodModifiers>,
  isRivalry: boolean
) {
  const rawFameA = fameFromTags(outcome.winner === 'A' ? tags : []);
  const rawFameD = fameFromTags(outcome.winner === 'D' ? tags : []);
  return {
    fameA: Math.round(rawFameA.fame * moodMods.fameMultiplier * (isRivalry ? 2 : 1)),
    popA: Math.round(rawFameA.pop * moodMods.popMultiplier),
    fameD: Math.round(rawFameD.fame * moodMods.fameMultiplier),
    popD: Math.round(rawFameD.pop * moodMods.popMultiplier),
  };
}

/**
 * Process contract payouts.
 */
export function processContractPayouts(
  state: GameState,
  contract: BoutOffer | undefined,
  winnerId: string | null,
  currentWId: string,
  currentOId: string
): StateImpact[] {
  if (!contract) return [];

  const impacts: StateImpact[] = [];
  const rivalsUpdates = new Map<StableId, Partial<import('@/types/state.types').RivalStableData>>();

  const purse = contract.purse;
  const showFee = Math.floor(purse * 0.2);

  // Find rivals using O(1) map lookup
  const stableInfo = state.warriorToStableMap?.get(currentWId);
  const rivalA =
    stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;

  // Player payouts go via treasuryDelta. Rival payouts are handled in
  // stableManager.weeklyIncome (which iterates arenaHistory and adds
  // FIGHT_PURSE / WIN_BONUS per bout) — paying them twice causes treasuries
  // to balloon into the millions. Multi-bout-per-tick clobbering on
  // rivalsUpdates' mapMerge would also lose payouts here, so the canonical
  // path is stableManager only.
  if (winnerId === currentWId) {
    if (!rivalA) impacts.push({ treasuryDelta: purse });
  } else if (winnerId === currentOId) {
    if (!rivalA) impacts.push({ treasuryDelta: showFee });
  } else {
    // Draw
    if (!rivalA) impacts.push({ treasuryDelta: showFee });
  }

  if (rivalsUpdates.size > 0) {
    impacts.push({ rivalsUpdates });
  }

  // Update Promoter History
  const updatedPromoters = { ...state.promoters };
  const promoter = updatedPromoters[contract.promoterId];
  if (promoter) {
    updatedPromoters[contract.promoterId] = {
      ...promoter,
      history: {
        ...promoter.history,
        totalPursePaid: (promoter.history.totalPursePaid || 0) + purse,
        notableBouts: [
          ...(promoter.history.notableBouts || []),
          `bout_${state.week}_${currentWId}_vs_${currentOId}` as FightId,
        ],
      },
    };
  }
  impacts.push({ promoters: updatedPromoters });

  // Close the contract
  const { [contract.id]: _removed, ...remainingBoutOffers } = state.boutOffers; // eslint-disable-line @typescript-eslint/no-unused-vars
  impacts.push({ boutOffers: remainingBoutOffers });

  return impacts;
}

/**
 * Get default plan.
 */
export function getDefaultPlan(
  w: Warrior,
  defaultPlanForWarrior: (w: Warrior) => import('@/types/combat.types').FightPlan
) {
  return w.plan ?? defaultPlanForWarrior(w);
}
