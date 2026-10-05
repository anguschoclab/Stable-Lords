import { GameState } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

/** Multiplier applied to the purse when a stable counters for more gold. */
export const COUNTER_PURSE_MULTIPLIER = 1.25;
/** Condition tag marking that an offer has already been countered once. */
export const COUNTERED_PURSE_CONDITION = 'COUNTERED_PURSE';
/** Condition tag marking that an offer's arena has already been countered once. */
export const COUNTERED_VENUE_CONDITION = 'COUNTERED_VENUE';
/**
 * Response-note tag for warriors whose owning stable left the world
 * mid-negotiation (dissolution, churn removal, roster cull). The response is
 * written 'Declined' so the offer can resolve, but the tag marks it as
 * operational rather than deliberate — the championship refusal sweep never
 * counts a voided decline as ducking and applies no contender cooldown.
 */
export const STABLE_DISSOLVED_REASON = 'stable-dissolved';

/**
 * All response-note tags that mark a decline as operational rather than
 * deliberate. The championship refusal sweep voids responses carrying any of
 * these — no refusal accrual, no contender cooldown. Register new operational
 * reasons here (e.g. a future 'roster-departed') so the sweep and tests share
 * one source of truth.
 */
const VOID_DECLINE_REASONS: ReadonlySet<string> = new Set([STABLE_DISSOLVED_REASON]);

/** Whether a response note marks the decline as operational/void. */
export function isVoidDeclineReason(note: string | undefined): boolean {
  return note != null && VOID_DECLINE_REASONS.has(note);
}

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

/**
 * Counter a bout offer on venue — the countering warrior refuses to fight at
 * the offered arena and nominates another. Same negotiation mechanics as a
 * purse counter (counterer marked 'Countered', other parties re-pended), but
 * the purse is untouched: `arenaId` is the only term that changes.
 * One round only — callers must not counter an offer already tagged
 * COUNTERED_VENUE or COUNTERED_PURSE.
 */
export function counterBoutVenue(
  state: GameState,
  offerId: BoutOfferId,
  counteringWarriorId: WarriorId,
  newArenaId: string
): StateImpact {
  const offer = state.boutOffers[offerId];
  if (!offer || !offer.arenaId) return {};
  if (
    offer.conditions?.includes(COUNTERED_VENUE_CONDITION) ||
    offer.conditions?.includes(COUNTERED_PURSE_CONDITION)
  ) {
    return {};
  }
  // Title bouts are pinned to the crown's arena — never negotiable.
  if (offer.titleArenaId) return {};

  const newResponses: Record<string, string> = {};
  for (const wid of offer.warriorIds) {
    newResponses[wid as string] = wid === counteringWarriorId ? 'Countered' : 'Pending';
  }

  return {
    boutOffers: {
      ...state.boutOffers,
      [offerId]: {
        ...offer,
        arenaId: newArenaId,
        conditions: [...(offer.conditions ?? []), COUNTERED_VENUE_CONDITION],
        responses: newResponses as typeof offer.responses,
        status: 'Proposed',
      },
    },
  };
}
