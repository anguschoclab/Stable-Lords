import type { GameStore } from '@/state/useGameStore';
import type { Promoter, GameState } from '@/types/state.types';
import type { PromoterId, FightId } from '@/types/shared.types';
import { updatePromoterHistory as engineUpdatePromoterHistory } from '@/engine/promoters';
import type { WorldSlice } from './types';

export function createPromoterActions(
  set: (fn: (state: WorldSlice) => Partial<GameStore> | WorldSlice) => void
) {
  return {
    updatePromoterHistory: (promoterId: PromoterId, purse: number, boutId: FightId) => {
      set(
        (state) =>
          engineUpdatePromoterHistory(
            state as unknown as GameState,
            promoterId,
            purse,
            boutId
          ) as unknown as Partial<GameStore>
      );
    },

    replacePromoter: (oldId: PromoterId, newPromoter: Promoter) => {
      set((state: WorldSlice) => {
        const { [oldId]: removed, ...remainingPromoters } = state.promoters;
        const newPromoters = { ...remainingPromoters, [newPromoter.id]: newPromoter };
        return { promoters: newPromoters };
      });
    },
  };
}
