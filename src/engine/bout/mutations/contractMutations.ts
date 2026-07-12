import { GameState } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';

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

  // Check if all parties have responded
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
        responses: newResponses,
        status: newStatus,
      },
    },
  };
}
