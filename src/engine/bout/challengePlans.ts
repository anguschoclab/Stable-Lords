/**
 * Challenge-context plan resolution (canon "special strategy" slot).
 *
 * A FightPlan may carry `challengePlans.whenProposer` / `.whenChallenged`
 * overrides. At plan-selection time — before `simulateFight` — the override
 * matching the warrior's role in this bout is merged over the base plan.
 * Tournament pairings carry synthetic `tour_*` contractIds and never resolve
 * a challenge context; offers without an identifiable proposer resolve none.
 */
import type { Warrior } from '@/types/warrior.types';
import type { BoutOffer } from '@/types/state/rankings';
import type { FightPlan } from '@/types/combat.types';
import { tournamentIdFromContractId } from './core/pairings';

/**
 * Resolve the FightPlan a warrior actually runs for this bout, applying the
 * challenge-context override when one matches their role.
 *
 * Role detection: `contract.proposerStableId === warrior.stableId` marks the
 * proposer; absent that, `contract.warriorIds[0]` is the proposing warrior
 * (bid conversion always lists the proposer first). The other combatant is
 * "challenged". Returns `plan` unchanged when no override applies.
 */
export function applyChallengeContext(
  warrior: Warrior,
  plan: FightPlan,
  contract: BoutOffer | undefined
): FightPlan {
  const slots = plan.challengePlans;
  if (!slots || !contract) return plan;
  if (tournamentIdFromContractId(contract.id as string)) return plan;

  const stableId = warrior.stableId as string | undefined;
  let role: 'proposer' | 'challenged' | undefined;
  if (contract.proposerStableId !== undefined) {
    role = contract.proposerStableId === stableId ? 'proposer' : 'challenged';
  } else if (contract.warriorIds.length > 0) {
    role = contract.warriorIds[0] === warrior.id ? 'proposer' : 'challenged';
  }
  if (!role) return plan;

  const override = role === 'proposer' ? slots.whenProposer : slots.whenChallenged;
  if (!override) return plan;
  const defined = Object.fromEntries(
    Object.entries(override).filter(([, v]) => v !== undefined)
  );
  return { ...plan, ...defined };
}
