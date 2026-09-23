import type { BoutOffer } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import {
  boutOfferAbsoluteWeek,
  boutOfferExpirationAbsoluteWeek,
} from '@/engine/core/absoluteWeek';

/**
 * Stable Lords — Bout Offer Cleanup
 *
 * Single source of truth for pruning `state.boutOffers`. Shared by:
 *  - `finalizeState` (end-of-week pipeline cleanup)
 *  - `RivalStrategyPass` (pre-bidding purge so stale offers don't block bids)
 *
 * An offer is dropped when:
 *  - its bout week is at/before `justFinishedAbsoluteWeek` (the bout already
 *    resolved or its window passed), or
 *  - it is still unsigned AND its expiration week is at/before
 *    `justFinishedAbsoluteWeek` — signed contracts survive expiry since the
 *    bout is already committed.
 */
export function pruneBoutOffers(
  offers: Record<BoutOfferId, BoutOffer>,
  justFinishedAbsoluteWeek: number
): Record<BoutOfferId, BoutOffer> {
  const cleaned: Record<BoutOfferId, BoutOffer> = {} as Record<BoutOfferId, BoutOffer>;
  for (const offer of Object.values(offers)) {
    if (boutOfferAbsoluteWeek(offer) <= justFinishedAbsoluteWeek) continue;
    if (
      offer.status !== 'Signed' &&
      offer.expirationWeek != null &&
      boutOfferExpirationAbsoluteWeek(offer) <= justFinishedAbsoluteWeek
    ) {
      continue;
    }
    cleaned[offer.id] = offer;
  }
  return cleaned;
}
