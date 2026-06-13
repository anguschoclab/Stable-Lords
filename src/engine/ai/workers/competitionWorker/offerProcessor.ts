import type { GameState, RivalStableData } from '@/types/state.types';
import { respondToBoutOffer } from '@/engine/bout/mutations/contractMutations';
import { StateImpact } from '@/engine/impacts';
import { evaluateBoutOffer } from './boutAcceptance';

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
  offersByRival.forEach((rivalOffers, rivalId) => {
    const owningRival = rivals.find((r) => r.id === rivalId);
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

        const response = evaluateBoutOffer(trackedOffer, owningRival, rivalWarrior, state.week);

        if (response === 'Accepted') {
          pickedWarriors.add(wId);
        }

        const impact = respondToBoutOffer(
          { ...state, boutOffers: currentOffers },
          offer.id,
          rivalWarrior.id,
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
