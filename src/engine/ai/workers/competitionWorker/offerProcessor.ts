import type { GameState, RivalStableData, WeatherType } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { StateImpact } from '@/engine/impacts';
import * as boutAcceptance from './boutAcceptance';

/**
 *
 */
export function processAllRivalsBoutOffers(
  state: GameState,
  rivals: RivalStableData[]
): StateImpact {
  const currentOffers = { ...state.boutOffers };
  const pendingOffers = Object.values(currentOffers).filter((o) => o.status === 'Proposed');

  // Group offers by stableId (each rival gets their weekly slate)
  const offersByRival = new Map<string, typeof pendingOffers>();

  pendingOffers.forEach((offer) => {
    offer.warriorIds.forEach((wId) => {
      // Find which rival owns this warrior using O(1) map lookup
      const stableInfo = state.warriorToStableMap?.get(wId);
      const owningRival =
        stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;
      if (!owningRival) return;

      // Group by rival stable ID
      let offersForRival = offersByRival.get(owningRival.id);
      if (!offersForRival) {
        offersForRival = [];
        offersByRival.set(owningRival.id, offersForRival);
      }
      offersForRival.push(offer);
    });
  });

  // Process each rival's slate
  const rivalMap = new Map(rivals.map((r) => [r.id, r]));
  offersByRival.forEach((rivalOffers, rivalId) => {
    const owningRival = rivalMap.get(rivalId as import('@/types/shared.types').StableId);
    if (!owningRival) return;

    // Track warriors already committed this week
    const pickedWarriors = new Set<string>();

    const sortedOffers = [...rivalOffers].sort((a, b) => {
      const scoreA = a.hype * a.purse;
      const scoreB = b.hype * b.purse;
      return scoreB - scoreA;
    });

    sortedOffers.forEach((offer) => {
      offer.warriorIds.forEach((wId) => {
        // Skip if warrior not owned by this rival
        if (!owningRival.roster.some((w) => w.id === wId)) return;

        // Skip if warrior already committed this week
        if (pickedWarriors.has(wId)) return;

        // Skip if already responded in our local tracking
        const trackedOffer = currentOffers[offer.id];
        if (!trackedOffer || trackedOffer.responses[wId] !== 'Pending') return;

        const rivalWarrior = state.warriorMap?.get(wId);
        if (!rivalWarrior) return;

        // Find the opponent for this offer
        const opponentId = offer.warriorIds.find((id) => id !== wId);
        const opponent = opponentId ? state.warriorMap?.get(opponentId) : undefined;

        // Call verifyBoutAcceptance first for weather skepticism
        if (opponent) {
          const acceptance = boutAcceptance.verifyBoutAcceptance(
            owningRival,
            rivalWarrior,
            opponent,
            state.weather as WeatherType
          );
          if (!acceptance.accepted) {
            const impact = respondToBoutOffer(
              { ...state, boutOffers: currentOffers },
              offer.id as BoutOfferId,
              rivalWarrior.id as WarriorId,
              'Declined'
            );
            if (impact.boutOffers) {
              Object.assign(currentOffers, impact.boutOffers);
            }
            return;
          }
        }

        const response = boutAcceptance.evaluateBoutOffer(
          trackedOffer,
          owningRival,
          rivalWarrior,
          state.week,
          state.weather as WeatherType
        );

        if (response === 'Accepted') {
          pickedWarriors.add(wId);
        }

        const impact = respondToBoutOffer(
          { ...state, boutOffers: currentOffers },
          offer.id as BoutOfferId,
          rivalWarrior.id as WarriorId,
          response
        );
        if (impact.boutOffers) {
          Object.assign(currentOffers, impact.boutOffers);
        }
      });
    });
  });

  return { boutOffers: currentOffers };
}
