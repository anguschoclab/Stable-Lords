import { GameState } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

/** Multiplier applied to the purse when a stable counters for more gold. */
export const COUNTER_PURSE_MULTIPLIER = 1.25;
/** Condition tag marking that an offer has already been countered once. */
export const COUNTERED_PURSE_CONDITION = 'COUNTERED_PURSE';

/**
 * Respond to bout offer.
 */
export function respondToBoutOffer(
  state: GameState,
  offerId: BoutOfferId,
  warriorId: WarriorId,
  response: 'Accepted' | 'Declined'
): StateImpact {
  const offer = state.boutOffers[offerId];
  if (!offer) return {};

  const newResponses: Record<string, string> = {
    ...offer.responses,
    [warriorId]: response,
  };

  // Check if all parties have responded. 'Countered' counts as an affirmative
  // response once the other side accepts the sweetened terms — a counter is
  // "yes, if" and the acceptance closes the deal.
  let newStatus = offer.status;
  const allParticipatingWarriors = offer.warriorIds;
  const allResponded = allParticipatingWarriors.every(
    (wid: string) => newResponses[wid] && newResponses[wid] !== 'Pending'
  );

  if (allResponded) {
    const anyDeclined = allParticipatingWarriors.some(
      (wid: string) => newResponses[wid] === 'Declined'
    );
    newStatus = anyDeclined ? 'Rejected' : 'Signed';
  }

  return {
    boutOffers: {
      ...state.boutOffers,
      [offerId]: {
        ...offer,
        responses: newResponses as typeof offer.responses,
        status: newStatus,
      },
    },
  };
}

/**
 * Counter a bout offer — the countering warrior demands a bigger purse.
 * The offer stays Proposed: the counterer is marked 'Countered', every other
 * party goes back to 'Pending', the purse rises by COUNTER_PURSE_MULTIPLIER,
 * and the offer records the bump so the proposer side can be budget-checked.
 * One round only — callers must not counter an offer already tagged
 * COUNTERED_PURSE.
 */
export function counterBoutOffer(
  state: GameState,
  offerId: BoutOfferId,
  counteringWarriorId: WarriorId
): StateImpact {
  const offer = state.boutOffers[offerId];
  if (!offer) return {};
  if (offer.conditions?.includes(COUNTERED_PURSE_CONDITION)) return {};

  const newPurse = Math.ceil(offer.purse * COUNTER_PURSE_MULTIPLIER);
  const bump = newPurse - offer.purse;

  const newResponses: Record<string, string> = {};
  for (const wid of offer.warriorIds) {
    newResponses[wid as string] = wid === counteringWarriorId ? 'Countered' : 'Pending';
  }

  return {
    boutOffers: {
      ...state.boutOffers,
      [offerId]: {
        ...offer,
        purse: newPurse,
        counterPurseBump: (offer.counterPurseBump ?? 0) + bump,
        conditions: [...(offer.conditions ?? []), COUNTERED_PURSE_CONDITION],
        responses: newResponses as typeof offer.responses,
        status: 'Proposed',
      },
    },
  };
}
