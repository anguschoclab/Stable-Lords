import type { GameState, RivalStableData, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId, StableId } from '@/types/shared.types';
import {
  respondToBoutOffer,
  STABLE_DISSOLVED_REASON,
} from '@/engine/bout/mutations/contractMutations';
import { StateImpact } from '@/engine/impacts';
import {
  applyOfferImpact,
  buildFinalizedIndex,
  groupOffersByRival,
  type FinalizedIndex,
  type OfferMap,
} from './shared';
import { processRivalSlate } from './slate';
import { resolveCounteredOffers } from './counters';

/**
 * Void resolution: a Pending warrior who belongs to no finalized rival — and
 * is not player-owned — has nobody left to speak for them (stable dissolved,
 * churn removal, mid-tick cull). Mark the response Declined with a
 * stable-dissolved note so the offer resolves instead of silently lapsing;
 * the refusal sweep reads the note and treats it as operational, not ducking.
 */
function markOwnerlessResponses(
  state: GameState,
  currentOffers: OfferMap,
  finalizedIndex: FinalizedIndex
): void {
  const playerIds = new Set<string>((state.roster ?? []).map((w) => w.id));
  for (const offer of Object.values(currentOffers)) {
    if (offer.status !== 'Proposed') continue;
    for (const wId of offer.warriorIds) {
      if (offer.responses?.[wId] !== 'Pending') continue;
      if (finalizedIndex.has(wId) || playerIds.has(wId)) continue;

      const impact = respondToBoutOffer(
        { ...state, boutOffers: currentOffers },
        offer.id as BoutOfferId,
        wId as WarriorId,
        'Declined'
      );
      applyOfferImpact(currentOffers, impact);
      const tracked = currentOffers[offer.id];
      if (tracked) {
        tracked.responseNotes = {
          ...(tracked.responseNotes ?? {}),
          [wId]: STABLE_DISSOLVED_REASON,
        };
      }
    }
  }
}

/**
 * Processes all pending bout offers for rival stables: groups offers per
 * rival, resolves each slate (accept/counter/decline), then sweeps countered
 * offers for the proposer-side bump resolution.
 */
export function processAllRivalsBoutOffers(
  state: GameState,
  rivals: RivalStableData[]
): StateImpact {
  const currentOffers = { ...state.boutOffers };
  const pendingOffers = Object.values(currentOffers).filter(
    (o: BoutOffer) => o.status === 'Proposed'
  );

  // Group offers by finalized roster ownership (each rival gets their slate)
  const finalizedIndex = buildFinalizedIndex(rivals);
  const offersByRival = groupOffersByRival(pendingOffers, finalizedIndex);

  // Process each rival's slate
  // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
  const rivalMap = new Map<StableId | string, RivalStableData>();
  for (const r of rivals) {
    rivalMap.set(r.id, r);
    if (r.owner.id !== r.id) rivalMap.set(r.owner.id, r);
  }
  offersByRival.forEach((rivalOffers, rivalId) => {
    const owningRival = rivalMap.get(rivalId as StableId);
    if (!owningRival) return;
    processRivalSlate(state, currentOffers, rivalOffers, owningRival);
  });

  resolveCounteredOffers(state, currentOffers, rivalMap, finalizedIndex);
  markOwnerlessResponses(state, currentOffers, finalizedIndex);

  return { boutOffers: currentOffers };
}
