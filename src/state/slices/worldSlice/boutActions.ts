import type { GameStore } from '@/state/useGameStore';
import type { BoutOffer, GameState } from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import { respondToBoutOffer as engineRespondToBoutOffer } from '@/state/mutations/contractMutations';
import type { WorldSlice } from './types';

export function createBoutActions(
  set: (fn: (state: WorldSlice) => Partial<GameStore> | WorldSlice) => void
) {
  return {
    updateBoutOfferStatus: (offerId: BoutOfferId, status: BoutOffer['status']) => {
      set((state: WorldSlice) => {
        if (!state.boutOffers[offerId]) return state;
        return {
          boutOffers: {
            ...state.boutOffers,
            [offerId]: { ...state.boutOffers[offerId], status },
          },
        };
      });
    },

    respondToBoutOffer: (
      offerId: BoutOfferId,
      warriorId: WarriorId,
      response: 'Accepted' | 'Declined'
    ) => {
      set(
        (state) =>
          engineRespondToBoutOffer(
            state as unknown as GameState,
            offerId,
            warriorId,
            response
          ) as unknown as Partial<GameStore>
      );
    },

    clearExpiredOffers: () => {
      set((state: WorldSlice) => {
        const newOffers = { ...state.boutOffers };
        let changed = false;

        (Object.keys(newOffers) as BoutOfferId[]).forEach((id) => {
          const offer = newOffers[id];
          if (!offer) return;
          if (offer.status === 'Proposed' && state.week >= offer.expirationWeek) {
            newOffers[id] = { ...offer, status: 'Expired' };
            changed = true;
          }
        });

        return changed ? { boutOffers: newOffers } : state;
      });
    },
  };
}
