import type {
  GameState,
  RivalStableData,
  Warrior,
  WeatherType,
  BoutOffer,
} from '@/types/state.types';
import type { BoutOfferId, WarriorId, StableId } from '@/types/shared.types';
import {
  respondToBoutOffer,
  COUNTER_PURSE_MULTIPLIER,
} from '@/engine/bout/mutations/contractMutations';
import { checkBudget } from '../../budgetWorker';
import * as boutAcceptance from '../boutAcceptance';
import { resolveSecondRound } from '../negotiation';
import { applyOfferImpact, type FinalizedIndex, type OfferMap } from './shared';

interface EscalateCounterArgs {
  state: GameState;
  currentOffers: OfferMap;
  offer: BoutOffer;
  wId: WarriorId;
  verdict: 'Countered' | 'CounteredVenue';
  pendingWarrior: Warrior;
  owningRival: RivalStableData;
}

/**
 * Stamp the bounded second-round counter (Stage C): the contract mutations
 * are one-round-only by design, so the escalation edits the live offer
 * directly — counterer marked, other side re-pended, `negotiationRound`
 * bumped. Purse escalations sweeten by the same multiplier; venue
 * escalations swap the arena. Returns false when a venue counter has no
 * arena to move to (caller declines instead).
 */
function escalateCounter(args: EscalateCounterArgs): boolean {
  const { state, currentOffers, offer, wId, verdict, pendingWarrior, owningRival } = args;
  const live = currentOffers[offer.id];
  if (!live) return false;

  if (verdict === 'CounteredVenue') {
    const target = boutAcceptance.venueCounterTarget(offer, pendingWarrior, owningRival, state);
    if (!target) return false;
    live.arenaId = target;
  } else {
    const newPurse = Math.ceil(live.purse * COUNTER_PURSE_MULTIPLIER);
    live.counterPurseBump = (live.counterPurseBump ?? 0) + (newPurse - live.purse);
    live.purse = newPurse;
  }

  const newResponses: Record<string, string> = {};
  for (const wid of live.warriorIds) {
    newResponses[wid as string] = wid === wId ? 'Countered' : 'Pending';
  }
  live.responses = newResponses as typeof live.responses;
  live.negotiationRound = (live.negotiationRound ?? 0) + 1;
  return true;
}

/**
 * Negotiation resolution sweep: every offer now carrying a 'Countered'
 * response gets its remaining 'Pending' AI-owned warriors resolved in-pass.
 * The proposer side must afford the purse bump (checkBudget); a pending
 * player warrior is left Pending — the counter surfaces in the UI.
 */
export function resolveCounteredOffers(
  state: GameState,
  currentOffers: OfferMap,
  rivalMap: Map<StableId | string, RivalStableData>,
  finalizedIndex: FinalizedIndex
): void {
  for (const offer of Object.values(currentOffers)) {
    if (offer.status !== 'Proposed') continue;
    const responses = offer.responses ?? {};
    const hasCounter = Object.values(responses).includes('Countered');
    if (!hasCounter) continue;

    for (const wId of offer.warriorIds) {
      if (responses[wId] !== 'Pending') continue;
      // Player-owned pending responses are the player's call; ownerless
      // warriors fall through to the void-marker pass below.
      const owningRival = finalizedIndex.get(wId);
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
        (proposerStable !== undefined && checkBudget(proposerStable, bump, 'OTHER').isAffordable);

      let final: 'Accepted' | 'Declined';
      let declineReason: string | undefined;
      if (!affordable) {
        final = 'Declined';
        declineReason = 'proposer-cant-fund';
      } else {
        const verdict = boutAcceptance.evaluateBoutOffer(
          { offer: offer, rival: owningRival, warrior: pendingWarrior, currentWeek: state.absoluteWeek, weather: state.weather as WeatherType, opponent: opponent, state: state }
        );
        // Stage C: one bounded escalation — a second-round counter may
        // stand (negotiationRound 0→1) when the stable tolerates haggling;
        // after that the offer is take-it-or-leave-it.
        const outcome = resolveSecondRound(offer, verdict, owningRival);
        if (
          (outcome.final === 'Countered' || outcome.final === 'CounteredVenue') &&
          escalateCounter({ state: state, currentOffers: currentOffers, offer: offer, wId: wId, verdict: outcome.final, pendingWarrior: pendingWarrior, owningRival: owningRival })
        ) {
          continue; // offer stays Proposed for the next pass — bounded by round
        }
        final = outcome.final === 'Accepted' ? 'Accepted' : 'Declined';
        declineReason = outcome.final === 'Declined' ? outcome.reason : undefined;
      }

      const impact = respondToBoutOffer(
        { ...state, boutOffers: currentOffers },
        offer.id as BoutOfferId,
        wId as WarriorId,
        final
      );
      applyOfferImpact(currentOffers, impact);
      if (final === 'Declined' && declineReason) {
        const updated = currentOffers[offer.id];
        if (updated) {
          updated.responseNotes = { ...(updated.responseNotes ?? {}), [wId]: declineReason };
        }
      }
    }
  }
}
