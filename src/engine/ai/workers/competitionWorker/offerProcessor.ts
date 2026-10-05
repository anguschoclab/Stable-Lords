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
  counterBoutOffer,
  counterBoutVenue,
  STABLE_DISSOLVED_REASON,
  COUNTER_PURSE_MULTIPLIER,
} from '@/engine/bout/mutations/contractMutations';
import { checkBudget } from '../budgetWorker';
import { StateImpact } from '@/engine/impacts';
import * as boutAcceptance from './boutAcceptance';
import { resolveSecondRound } from './negotiation';

type OfferMap = Record<string, BoutOffer>;

/**
 * warriorId → finalized owning rival. Built from the post-shard rival list
 * rather than the week-start `warriorToStableMap`/`rivalMap` snapshot — those
 * maps go stale the moment a stable dissolves, swaps, or poaches mid-tick,
 * and stale ownership is how whole offer slates used to go silently
 * unanswered (the zombie-stable strip bug).
 */
type FinalizedIndex = Map<string, RivalStableData>;

function buildFinalizedIndex(rivals: RivalStableData[]): FinalizedIndex {
  const index: FinalizedIndex = new Map();
  for (const rival of rivals) {
    for (const w of rival.roster) index.set(w.id, rival);
  }
  return index;
}

/** Groups pending offers by the finalized rival that owns each warrior. */
function groupOffersByRival(
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
function applyOfferImpact(currentOffers: OfferMap, impact: StateImpact): void {
  if (impact.boutOffers) {
    Object.assign(currentOffers, impact.boutOffers);
  }
}

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

/** Commit one response to the offer map; title bouts persist the verdict reason. */
function applyWarriorResponse(args: ApplyWarriorResponseArgs): void {
  const { state, currentOffers, offer, trackedOffer, wId } = args;
  const { rivalWarrior, response, explain } = args;
  const impact = respondToBoutOffer(
    { ...state, boutOffers: currentOffers },
    offer.id as BoutOfferId,
    rivalWarrior.id as WarriorId,
    response
  );
  applyOfferImpact(currentOffers, impact);
  // Title bouts: persist the verdict reason so the offer card can show
  // why the rival answered the way they did.
  if (trackedOffer.titleArenaId && explain.reason) {
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
function processRivalSlate(
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

/**
 * Stamp the bounded second-round counter (Stage C): the contract mutations
 * are one-round-only by design, so the escalation edits the live offer
 * directly — counterer marked, other side re-pended, `negotiationRound`
 * bumped. Purse escalations sweeten by the same multiplier; venue
 * escalations swap the arena. Returns false when a venue counter has no
 * arena to move to (caller declines instead).
 */
function escalateCounter(
  state: GameState,
  currentOffers: OfferMap,
  offer: BoutOffer,
  wId: WarriorId,
  verdict: 'Countered' | 'CounteredVenue',
  pendingWarrior: Warrior,
  owningRival: RivalStableData
): boolean {
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
function resolveCounteredOffers(
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
          escalateCounter(state, currentOffers, offer, wId, outcome.final, pendingWarrior, owningRival)
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
  const pendingOffers = Object.values(currentOffers).filter((o) => o.status === 'Proposed');

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
