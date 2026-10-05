import { GameState, RivalStableData } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import {
  generateBoutBids,
  convertBidsToOffers,
} from '@/engine/ai/workers/competitionWorker/boutBidding';
import { pruneBoutOffers } from '@/engine/bout/offerCleanup';
import { planWorldBouts } from '@/engine/matchmaking/worldMatchmaking';

/**
 * World matchmaking, per-rival bid generation, and offer conversion — the
 * full "who is fighting whom" stage for the coming week. Returns the merged
 * boutOffers map (existing + pruned + world bouts + bid offers).
 */
export function buildWeekOffers(
  state: GameState,
  currentRivals: RivalStableData[],
  rng: IRNGService
): Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]> {
  // 1.5. World Matchmaking: NPCs propose bouts to each other
  const worldBouts = planWorldBouts(state, rng);
  let boutOffersWithWorld: Record<BoutOfferId, (typeof state.boutOffers)[BoutOfferId]> = {
    ...(state.boutOffers || {}),
  };

  // 🧹 1.6 Hardening: Purge Expired Offers (Prevent state bloat).
  // Shares the single cleanup contract with finalizeState (offerCleanup.ts).
  boutOffersWithWorld = pruneBoutOffers(boutOffersWithWorld, state.absoluteWeek);

  if (worldBouts.length > 0) {
    worldBouts.forEach((o) => {
      boutOffersWithWorld[o.id] = o;
    });
  }

  // 1.7. Generate bout bids for each rival and convert to offers
  const allBids: {
    bid: import('@/engine/ai/workers/competitionWorker/types').BoutBid;
    rivalId: string;
  }[] = [];
  for (const rival of currentRivals) {
    const { bids } = generateBoutBids(
      { rival: rival, _currentWeek: state.absoluteWeek + 1, weather: state.weather ?? 'Clear', crowdMood: state.crowdMood ?? 'Calm', rivals: currentRivals, state: state }
    );
    for (const bid of bids) {
      allBids.push({ bid, rivalId: rival.id as string });
    }
  }

  // Build set of warrior IDs already in pending offers to prevent double-booking
  const existingOfferWarriorIds = new Set<string>();
  for (const offer of Object.values(boutOffersWithWorld)) {
    if (offer && offer.status === 'Proposed') {
      for (const wId of offer.warriorIds) {
        existingOfferWarriorIds.add(wId as string);
      }
    }
  }

  const bidOffers = convertBidsToOffers(
    allBids,
    currentRivals,
    { ...state, boutOffers: boutOffersWithWorld },
    rng,
    existingOfferWarriorIds
  );

  for (const offer of bidOffers) {
    boutOffersWithWorld[offer.id] = offer;
  }
  return boutOffersWithWorld;
}
