import { GameState, Warrior, BoutOffer } from '@/types/state.types';
import type { FightId, LedgerEntryId } from '@/types/shared.types';
import { StateImpact } from '@/engine/impacts';
import { getMoodModifiers } from '@/engine/bout/crowdMood';
import { FightOutcome } from '@/types/combat.types';
import { fameFromTags } from '@/engine/bout/fame';
import { isActive } from '@/engine/warrior/warriorStatus';
import { resolveRng } from '@/utils/random';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

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
  rng?: IRNGService;
}

/**
 * Player-side purse/show-fee impacts.
 *
 * Player payouts go via treasuryDelta. Rival payouts are handled in
 * stableManager.weeklyIncome (which iterates arenaHistory and adds
 * FIGHT_PURSE / WIN_BONUS per bout) — paying them twice causes treasuries
 * to balloon into the millions, so impacts only emit when a combatant fights
 * for the player. The player can sit on EITHER side: rival-proposed bouts,
 * title defenses vs a rival champion, and grudge matches all place the
 * contract warrior on side A with the player on side D — gating on side A
 * alone left those bouts paying the player nothing.
 */
function buildPurseImpacts(args: BuildPurseImpactsArgs): StateImpact[] {
  const { state, contract, purse, showFee, winnerId } = args;
  const { currentWId, currentOId, isRivalBout, rng } = args;
  const playerId = !isRivalBout
    ? currentWId
    : state.warriorToStableMap?.get(currentOId)?.isPlayer
      ? currentOId
      : undefined;
  if (!playerId) return [];
  const idRng = resolveRng(rng, state.week * 7919 + 11 + currentWId.length);
  const ledgerEntry = (label: string, amount: number) => ({
    id: idRng.uuid() as LedgerEntryId,
    week: state.week,
    label,
    amount,
    category: 'fight' as const,
  });
  if (winnerId === playerId) {
    return [
      { treasuryDelta: purse },
      { ledgerEntries: [ledgerEntry(`Purse — ${contract.id}`, purse)] },
    ];
  }
  if (winnerId === (playerId === currentWId ? currentOId : currentWId)) {
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
 * Args for processContractPayouts.
 */
export interface ContractPayoutArgs {
  state: GameState;
  contract: BoutOffer | undefined;
  winnerId: string | null;
  currentWId: string;
  currentOId: string;
  rng?: IRNGService;
}

/**
 * Process contract payouts.
 */
export function processContractPayouts(args: ContractPayoutArgs): StateImpact[] {
  const { state, contract, winnerId, currentWId, currentOId, rng } = args;
  if (!contract) return [];

  const impacts: StateImpact[] = [];

  const purse = contract.purse;
  const showFee = Math.floor(purse * 0.2);

  // Find rivals using O(1) map lookup
  const stableInfo = state.warriorToStableMap?.get(currentWId);
  const rivalA =
    stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;

  impacts.push(
    ...buildPurseImpacts({
      state: state,
      contract: contract,
      purse: purse,
      showFee: showFee,
      winnerId: winnerId,
      currentWId: currentWId,
      currentOId: currentOId,
      isRivalBout: rivalA != null,
      rng,
    })
  );

  // Promoter history only when the promoter exists — the impact replaces the
  // whole record, so an unknown promoterId would emit an unchanged map.
  if (state.promoters?.[contract.promoterId]) {
    impacts.push({
      promoters: updatePromoterHistory(state, contract, purse, currentWId, currentOId),
    });
  }

  // No boutOffers close-out impact: dictMerge can't delete keys (a rest-map
  // without the id merges state back in anyway), and re-emitting every
  // surviving offer's stale object just clobbers fresher writes — the
  // voided-cancel cancel write had to be ordered around exactly that. The
  // contract lingers as Signed until pruneStaleBoutOffers drops it next week.
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
