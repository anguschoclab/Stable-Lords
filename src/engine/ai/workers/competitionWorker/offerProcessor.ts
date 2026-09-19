import type { GameState, RivalStableData, WeatherType } from '@/types/state.types';
import type { BoutOfferId, WarriorId, StableId } from '@/types/shared.types';
import {
  respondToBoutOffer,
  counterBoutOffer,
} from '@/engine/bout/mutations/contractMutations';
import { checkBudget } from '../budgetWorker';
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
  // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
  const rivalMap = new Map<StableId | string, RivalStableData>();
  for (const r of rivals) {
    rivalMap.set(r.id, r);
    if (r.owner.id !== r.id) rivalMap.set(r.owner.id, r);
  }
  offersByRival.forEach((rivalOffers, rivalId) => {
    const owningRival = rivalMap.get(rivalId as StableId);
    if (!owningRival) return;

    // Track warriors already committed this week
    const pickedWarriors = new Set<string>();

    // ⚡ Bolt Optimization: Pre-compute Set for O(1) roster checks
    const owningRosterIds = new Set<string>();
    for (const w of owningRival.roster) owningRosterIds.add(w.id);

    const sortedOffers = [...rivalOffers].sort((a, b) => {
      const scoreA = a.hype * a.purse;
      const scoreB = b.hype * b.purse;
      return scoreB - scoreA;
    });

    sortedOffers.forEach((offer) => {
      offer.warriorIds.forEach((wId) => {
        // Skip if warrior not owned by this rival
        if (!owningRosterIds.has(wId)) return;

        // Skip if warrior already committed this week
        if (pickedWarriors.has(wId)) return;

        // Skip if already responded in our local tracking
        const trackedOffer = currentOffers[offer.id];
        if (!trackedOffer || trackedOffer.responses[wId] !== 'Pending') return;

        // Countered offers resolve only in the negotiation sweep below —
        // the proposer-side bump check must run there, not here.
        if (Object.values(trackedOffer.responses ?? {}).includes('Countered')) return;

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
          state.absoluteWeek,
          state.weather as WeatherType,
          opponent
        );

        if (response === 'Accepted') {
          pickedWarriors.add(wId);
        }

        if (response === 'Countered') {
          // One negotiation round: sweeten the purse and re-pend the other side.
          const impact = counterBoutOffer(
            { ...state, boutOffers: currentOffers },
            offer.id as BoutOfferId,
            rivalWarrior.id as WarriorId
          );
          if (impact.boutOffers) {
            Object.assign(currentOffers, impact.boutOffers);
          }
          return;
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

  // Negotiation resolution sweep: every offer now carrying a 'Countered'
  // response gets its remaining 'Pending' AI-owned warriors resolved in-pass.
  // The proposer side must afford the purse bump (checkBudget); a pending
  // player warrior is left Pending — the counter surfaces in the UI.
  for (const offer of Object.values(currentOffers)) {
    if (offer.status !== 'Proposed') continue;
    const responses = offer.responses ?? {};
    const hasCounter = Object.values(responses).includes('Countered');
    if (!hasCounter) continue;

    for (const wId of offer.warriorIds) {
      if (responses[wId] !== 'Pending') continue;
      const stableInfo = state.warriorToStableMap?.get(wId);
      if (!stableInfo || stableInfo.isPlayer) continue; // player's call
      const owningRival = rivalMap.get(stableInfo.stableId) ?? state.rivalMap?.get(stableInfo.stableId);
      if (!owningRival) continue;

      const pendingWarrior = state.warriorMap?.get(wId);
      if (!pendingWarrior) continue;
      const opponentId = offer.warriorIds.find((id) => id !== wId);
      const opponent = opponentId ? state.warriorMap?.get(opponentId) : undefined;

      // The proposer stable must be able to fund the purse bump.
      const proposerStable = offer.proposerStableId
        ? rivalMap.get(offer.proposerStableId)
        : undefined;
      const bump = offer.counterPurseBump ?? 0;
      const proposerSide = proposerStable?.roster.some((w) => w.id === wId) ?? false;
      const affordable =
        !proposerSide ||
        bump === 0 ||
        (proposerStable !== undefined &&
          checkBudget(proposerStable, bump, 'OTHER').isAffordable);

      let final: 'Accepted' | 'Declined';
      if (!affordable) {
        final = 'Declined';
      } else {
        const verdict = boutAcceptance.evaluateBoutOffer(
          offer,
          owningRival,
          pendingWarrior,
          state.absoluteWeek,
          state.weather as WeatherType,
          opponent
        );
        // No second counter round — an already-countered offer is take it or leave it.
        final = verdict === 'Declined' || verdict === 'Countered' ? 'Declined' : 'Accepted';
        if (verdict === 'Accepted') {
          // mark warrior committed (best effort — pickedWarriors is per-slate)
        }
      }

      const impact = respondToBoutOffer(
        { ...state, boutOffers: currentOffers },
        offer.id as BoutOfferId,
        wId as WarriorId,
        final
      );
      if (impact.boutOffers) {
        Object.assign(currentOffers, impact.boutOffers);
      }
    }
  }

  return { boutOffers: currentOffers };
}
