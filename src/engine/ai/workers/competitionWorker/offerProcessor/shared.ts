import type { RivalStableData, BoutOffer } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';

export type OfferMap = Record<string, BoutOffer>;

/**
 * warriorId → finalized owning rival. Built from the post-shard rival list
 * rather than the week-start `warriorToStableMap`/`rivalMap` snapshot — those
 * maps go stale the moment a stable dissolves, swaps, or poaches mid-tick,
 * and stale ownership is how whole offer slates used to go silently
 * unanswered (the zombie-stable strip bug).
 */
export type FinalizedIndex = Map<string, RivalStableData>;

export function buildFinalizedIndex(rivals: RivalStableData[]): FinalizedIndex {
  const index: FinalizedIndex = new Map();
  for (const rival of rivals) {
    for (const w of rival.roster) index.set(w.id, rival);
  }
  return index;
}

/** Groups pending offers by the finalized rival that owns each warrior. */
export function groupOffersByRival(
  pendingOffers: BoutOffer[],
  finalizedIndex: FinalizedIndex
): Map<string, BoutOffer[]> {
  const offersByRival = new Map<string, BoutOffer[]>();
  pendingOffers.forEach((offer) => {
    offer.warriorIds.forEach((wId) => {
      const owningRival = finalizedIndex.get(wId);
      if (!owningRival) return;

      let offersForRival = offersByRival.get(owningRival.id);
      if (!offersForRival) {
        offersForRival = [];
        offersByRival.set(owningRival.id, offersForRival);
      }
      offersForRival.push(offer);
    });
  });
  return offersByRival;
}

/** Applies a boutOffer-mutating impact into the local offer map. */
export function applyOfferImpact(currentOffers: OfferMap, impact: StateImpact): void {
  if (impact.boutOffers) {
    Object.assign(currentOffers, impact.boutOffers);
  }
}
