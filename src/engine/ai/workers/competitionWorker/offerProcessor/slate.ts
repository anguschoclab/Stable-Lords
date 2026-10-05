import type {
  GameState,
  RivalStableData,
  Warrior,
  WeatherType,
  BoutOffer,
} from '@/types/state.types';
import type { BoutOfferId, WarriorId } from '@/types/shared.types';
import {
  respondToBoutOffer,
  counterBoutOffer,
  counterBoutVenue,
} from '@/engine/bout/mutations/contractMutations';
import * as boutAcceptance from '../boutAcceptance';
import { applyOfferImpact, type OfferMap } from './shared';

interface WeatherGateDeclinedArgs {
  state: GameState;
  currentOffers: OfferMap;
  offer: BoutOffer;
  trackedOffer: BoutOffer;
  owningRival: RivalStableData;
  rivalWarrior: Warrior;
  opponent: Warrior | undefined;
}

/**
 * Weather-skepticism pre-gate: verifyBoutAcceptance runs before the full
 * evaluation — title offers are flagged so crown obligations bypass the soft
 * gates. Returns true when the warrior declined (impact applied).
 */
function weatherGateDeclined(args: WeatherGateDeclinedArgs): boolean {
  const { state, currentOffers, offer, trackedOffer, owningRival } = args;
  const { rivalWarrior, opponent } = args;
  if (!opponent) return false;
  const acceptance = boutAcceptance.verifyBoutAcceptance(
    owningRival,
    rivalWarrior,
    opponent,
    state.weather as WeatherType,
    { isTitleBout: !!trackedOffer.titleArenaId }
  );
  if (acceptance.accepted) return false;
  const impact = respondToBoutOffer(
    { ...state, boutOffers: currentOffers },
    offer.id as BoutOfferId,
    rivalWarrior.id as WarriorId,
    'Declined'
  );
  applyOfferImpact(currentOffers, impact);
  return true;
}

interface ApplyCounterResponseArgs {
  response: 'Countered' | 'CounteredVenue';
  state: GameState;
  currentOffers: OfferMap;
  offer: BoutOffer;
  trackedOffer: BoutOffer;
  owningRival: RivalStableData;
  rivalWarrior: Warrior;
  wId: WarriorId;
}

/**
 * Applies a counter response (venue first, purse fallback). Always resolves
 * the offer — a venue counter with no target falls through to the purse
 * counter.
 */
function applyCounterResponse(args: ApplyCounterResponseArgs): void {
  const { response, state, currentOffers, offer, trackedOffer } = args;
  const { owningRival, rivalWarrior, wId } = args;
  if (response === 'CounteredVenue') {
    // Venue counter: swap the arena, re-pend the other side — the purse
    // is untouched and the counter tag closes the negotiation round.
    const target = boutAcceptance.venueCounterTarget(
      trackedOffer,
      rivalWarrior,
      owningRival,
      state
    );
    if (target) {
      const impact = counterBoutVenue(
        { ...state, boutOffers: currentOffers },
        offer.id as BoutOfferId,
        wId,
        target
      );
      applyOfferImpact(currentOffers, impact);
      return;
    }
    // No venue to counter toward — fall through to the purse counter.
  }

  // One negotiation round: sweeten the purse and re-pend the other side.
  const impact = counterBoutOffer(
    { ...state, boutOffers: currentOffers },
    offer.id as BoutOfferId,
    wId
  );
  applyOfferImpact(currentOffers, impact);
}

interface RespondForWarriorArgs {
  state: GameState;
  currentOffers: OfferMap;
  offer: BoutOffer;
  wId: WarriorId;
  owningRival: RivalStableData;
  pickedWarriors: Set<string>;
}

/**
 * Resolves one warrior's response to one offer within a rival slate.
 * Returns true when the warrior is committed (accepted) this week.
 */
function respondForWarrior(args: RespondForWarriorArgs): void {
  const { state, currentOffers, offer, wId, owningRival } = args;
  const { pickedWarriors } = args;
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

  if (
    weatherGateDeclined(
      { state: state, currentOffers: currentOffers, offer: offer, trackedOffer: trackedOffer, owningRival: owningRival, rivalWarrior: rivalWarrior, opponent: opponent }
    )
  ) {
    return;
  }

  resolveEvaluatedResponse(
    { state: state, currentOffers: currentOffers, offer: offer, trackedOffer: trackedOffer, wId: wId, owningRival: owningRival, rivalWarrior: rivalWarrior, opponent: opponent, pickedWarriors: pickedWarriors }
  );
}

interface ResolveEvaluatedResponseArgs {
  state: GameState;
  currentOffers: OfferMap;
  offer: BoutOffer;
  trackedOffer: BoutOffer;
  wId: WarriorId;
  owningRival: RivalStableData;
  rivalWarrior: Warrior;
  opponent: Warrior | undefined;
  pickedWarriors: Set<string>;
}

/** Evaluate the offer and apply the verdict: accept, counter, or respond. */
function resolveEvaluatedResponse(args: ResolveEvaluatedResponseArgs): void {
  const { state, currentOffers, offer, trackedOffer, wId } = args;
  const { owningRival, rivalWarrior, opponent, pickedWarriors } = args;
  const explain: { reason?: string } = {};
  const response = boutAcceptance.evaluateBoutOffer(
    { offer: trackedOffer, rival: owningRival, warrior: rivalWarrior, currentWeek: state.absoluteWeek, weather: state.weather as WeatherType, opponent: opponent, state: state, explain: explain }
  );

  if (response === 'Accepted') {
    pickedWarriors.add(wId);
  }

  if (response === 'Countered' || response === 'CounteredVenue') {
    applyCounterResponse(
      { response: response, state: state, currentOffers: currentOffers, offer: offer, trackedOffer: trackedOffer, owningRival: owningRival, rivalWarrior: rivalWarrior, wId: wId }
    );
    return;
  }

  applyWarriorResponse(
    { state: state, currentOffers: currentOffers, offer: offer, trackedOffer: trackedOffer, wId: wId, rivalWarrior: rivalWarrior, response: response, explain: explain }
  );
}

interface ApplyWarriorResponseArgs {
  state: GameState;
  currentOffers: OfferMap;
  offer: BoutOffer;
  trackedOffer: BoutOffer;
  wId: WarriorId;
  rivalWarrior: Warrior;
  response: Parameters<typeof respondToBoutOffer>[3];
  explain: { reason?: string };
}

/** Commit one response to the offer map and persist the verdict reason. */
function applyWarriorResponse(args: ApplyWarriorResponseArgs): void {
  const { state, currentOffers, offer, wId } = args;
  const { rivalWarrior, response, explain } = args;
  const impact = respondToBoutOffer(
    { ...state, boutOffers: currentOffers },
    offer.id as BoutOfferId,
    rivalWarrior.id as WarriorId,
    response
  );
  applyOfferImpact(currentOffers, impact);
  // Every rival verdict: persist the reason so the offer card can show
  // why the stable answered the way they did (Stage E — was title-only).
  if (explain.reason) {
    const updated = currentOffers[offer.id];
    if (updated) {
      updated.responseNotes = {
        ...(updated.responseNotes ?? {}),
        [wId]: explain.reason,
      };
    }
  }
}

/** Processes one rival's weekly slate: sorted offers x owned warriors. */
export function processRivalSlate(
  state: GameState,
  currentOffers: OfferMap,
  rivalOffers: BoutOffer[],
  owningRival: RivalStableData
): void {
  // Track warriors already committed this week
  const pickedWarriors = new Set<string>();

  // ⚡ Bolt Optimization: Pre-compute Set for O(1) roster checks
  const owningRosterIds = new Set<string>();
  for (const w of owningRival.roster) owningRosterIds.add(w.id);

  const sortedOffers = [...rivalOffers].sort((a, b) => {
    // Title bouts always outrank ordinary offers — a crown obligation or a
    // title shot precedes any purse comparison, so a warrior commits to the
    // title bout before the slate fills.
    const tA = a.titleArenaId ? 1 : 0;
    const tB = b.titleArenaId ? 1 : 0;
    if (tA !== tB) return tB - tA;
    const scoreA = a.hype * a.purse;
    const scoreB = b.hype * b.purse;
    return scoreB - scoreA;
  });

  sortedOffers.forEach((offer) => {
    offer.warriorIds.forEach((wId) => {
      // Skip if warrior not owned by this rival
      if (!owningRosterIds.has(wId)) return;
      respondForWarrior({ state: state, currentOffers: currentOffers, offer: offer, wId: wId, owningRival: owningRival, pickedWarriors: pickedWarriors });
    });
  });
}
