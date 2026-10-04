import { GameState, Warrior, BoutOffer } from '@/types/state.types';
import type { StableId, FightId, LedgerEntryId } from '@/types/shared.types';
import { StateImpact } from '@/engine/impacts';
import { getMoodModifiers } from '@/engine/bout/crowdMood';
import { FightOutcome } from '@/types/combat.types';
import { fameFromTags } from '@/engine/bout/fame';
import { isActive } from '@/engine/warrior/warriorStatus';
import { generateId } from '@/utils/idUtils';

/**
 * Validate bout combatants — symmetric: both sides must exist, be Active,
 * and not be registered dead. The old side-A-only check let dead warriors
 * in the D slot fight and be re-killed (kill/death divergence).
 *
 * @param currentW - Current w. (optional)
 * @param currentO - Current o. (optional)
 * @param deadIds - Persistent death registry (deadWarriorIds ∪ graveyard).
 */
export function validateBoutCombatants(
  currentW?: Warrior,
  currentO?: Warrior,
  deadIds?: ReadonlySet<string>
): boolean {
  if (!currentW || !currentO) return false;
  if (!isActive(currentW) || !isActive(currentO)) return false;
  if (deadIds && (deadIds.has(currentW.id) || deadIds.has(currentO.id))) return false;
  return true;
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

interface BuildPurseImpactsArgs {
  state: GameState;
  contract: BoutOffer;
  purse: number;
  showFee: number;
  winnerId: string | null;
  currentWId: string;
  currentOId: string;
  isRivalBout: boolean;
}

/**
 * Player-side purse/show-fee impacts.
 *
 * Player payouts go via treasuryDelta. Rival payouts are handled in
 * stableManager.weeklyIncome (which iterates arenaHistory and adds
 * FIGHT_PURSE / WIN_BONUS per bout) — paying them twice causes treasuries
 * to balloon into the millions, so when the winner fights for a rival stable
 * these impacts are skipped entirely.
 */
function buildPurseImpacts(args: BuildPurseImpactsArgs): StateImpact[] {
  const { state, contract, purse, showFee, winnerId } = args;
  const { currentWId, currentOId, isRivalBout } = args;
  if (isRivalBout) return [];
  const ledgerEntry = (label: string, amount: number) => ({
    id: generateId(undefined, 'ledger') as LedgerEntryId,
    week: state.week,
    label,
    amount,
    category: 'fight' as const,
  });
  if (winnerId === currentWId) {
    return [
      { treasuryDelta: purse },
      { ledgerEntries: [ledgerEntry(`Purse — ${contract.id}`, purse)] },
    ];
  }
  if (winnerId === currentOId) {
    return [
      { treasuryDelta: showFee },
      { ledgerEntries: [ledgerEntry(`Show fee — ${contract.id}`, showFee)] },
    ];
  }
  // Draw
  return [
    { treasuryDelta: showFee },
    { ledgerEntries: [ledgerEntry(`Show fee (draw) — ${contract.id}`, showFee)] },
  ];
}

/** Book the purse and bout into the promoter's history. */
function updatePromoterHistory(
  state: GameState,
  contract: BoutOffer,
  purse: number,
  currentWId: string,
  currentOId: string
): GameState['promoters'] {
  const updatedPromoters = { ...state.promoters };
  const promoter = updatedPromoters[contract.promoterId];
  if (promoter) {
    updatedPromoters[contract.promoterId] = {
      ...promoter,
      history: {
        ...promoter.history,
        totalPursePaid: (promoter.history.totalPursePaid || 0) + purse,
        notableBouts: [
          ...(promoter.history.notableBouts || []).slice(-9),
          `bout_${state.week}_${currentWId}_vs_${currentOId}` as FightId,
        ],
      },
    };
  }
  return updatedPromoters;
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

  impacts.push(
    ...buildPurseImpacts(
      { state: state, contract: contract, purse: purse, showFee: showFee, winnerId: winnerId, currentWId: currentWId, currentOId: currentOId, isRivalBout: rivalA != null }
    )
  );

  if (rivalsUpdates.size > 0) {
    impacts.push({ rivalsUpdates });
  }

  impacts.push({
    promoters: updatePromoterHistory(state, contract, purse, currentWId, currentOId),
  });

  // Close the contract
  const { [contract.id]: _removed, ...remainingBoutOffers } = state.boutOffers;
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
