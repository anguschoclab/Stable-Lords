/**
 * Promoters Domain Impacts
 * Handles bout offers and promoter-related state impacts.
 */
import type { GameState, BoutOffer, Promoter } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';

/**
 * Apply bout offers to state.
 */
export const boutOffers = (state: GameState, value: Record<BoutOfferId, BoutOffer>) => {
  state.boutOffers = { ...(state.boutOffers || {}), ...value };
};

/**
 * Apply promoters to state.
 */
export const promoters = (state: GameState, value: Record<string, Promoter>) => {
  state.promoters = value;
};

/**
 * Promoters impact handlers map.
 */
export const promotersHandlers = {
  boutOffers,
  promoters,
};
