import { GameState, Warrior, BoutOffer } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import { getMoodModifiers } from '@/engine/crowdMood';
import { FightOutcome } from '@/types/combat.types';
import { fameFromTags } from '@/engine/fame';/**
 * Validate bout combatants.
 * @param currentW - Current w. (optional)
 * @param currentO - Current o. (optional)
 * @returns The result.
 */


export function validateBoutCombatants(currentW?: Warrior, currentO?: Warrior): boolean {
  return !!currentW && currentW.status === 'Active' && !!currentO;
}/**
 * Get winner id.
 * @param outcome - Outcome.
 * @param wId - W id.
 * @param oId - O id.
 * @returns The result.
 */


export function getWinnerId(outcome: FightOutcome, wId: string, oId: string): string | null {
  if (outcome.winner === 'A') return wId;
  if (outcome.winner === 'D') return oId;
  return null;
}/**
 * Calculate bout fame.
 * @param outcome - Outcome.
 * @param tags - Tags.
 * @param moodMods - Mood mods.
 * @param isRivalry - Is rivalry.
 * @returns The result.
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
}/**
 * Process contract payouts.
 * @param state - State.
 * @param contract - Contract.
 * @param winnerId - Winner id.
 * @param currentWId - Current w id.
 * @param currentOId - Current o id.
 * @returns The result.
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
  const rivalsUpdates = new Map<string, Partial<GameState>>();

  const purse = contract.purse;
  const showFee = Math.floor(purse * 0.2);

  // Find rivals using O(1) map lookup
  const stableInfo = state.warriorToStableMap?.get(currentWId);
  const rivalA = stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;

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
  if (updatedPromoters[contract.promoterId]) {
    updatedPromoters[contract.promoterId] = {
      ...updatedPromoters[contract.promoterId],
      history: {
        ...updatedPromoters[contract.promoterId].history,
        totalPursePaid: (updatedPromoters[contract.promoterId].history.totalPursePaid || 0) + purse,
        notableBouts: [
          ...(updatedPromoters[contract.promoterId].history.notableBouts || []),
          `bout_${state.week}_${currentWId}_vs_${currentOId}`,
        ],
      },
    };
  }
  impacts.push({ promoters: updatedPromoters });

  // Close the contract
  const { [contract.id]: _, ...remainingBoutOffers } = state.boutOffers;
  impacts.push({ boutOffers: remainingBoutOffers });

  return impacts;
}/**
 * Get default plan.
 * @param w - W.
 * @param defaultPlanForWarrior - Default plan for warrior.
 * @returns The result.
 */


export function getDefaultPlan(
  w: Warrior,
  defaultPlanForWarrior: (w: Warrior) => import('@/types/combat.types').FightPlan
) {
  return w.plan ?? defaultPlanForWarrior(w);
}
