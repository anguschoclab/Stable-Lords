import type { GameState, RivalStableData, Warrior, WeatherType, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WarriorId, StableId } from '@/types/shared.types';
import {
  respondToBoutOffer,
  counterBoutOffer,
  counterBoutVenue,
} from '@/engine/bout/mutations/contractMutations';
import { checkBudget } from '../budgetWorker';
import { StateImpact } from '@/engine/impacts';
import * as boutAcceptance from './boutAcceptance';

type OfferMap = Record<string, BoutOffer>;

/** Groups pending offers by the rival stable that owns each warrior. */
function groupOffersByRival(
  state: GameState,
  pendingOffers: BoutOffer[]
): Map<string, BoutOffer[]> {
  const offersByRival = new Map<string, BoutOffer[]>();
  pendingOffers.forEach((offer) => {
    offer.warriorIds.forEach((wId) => {
      // Find which rival owns this warrior using O(1) map lookup
      const stableInfo = state.warriorToStableMap?.get(wId);
      const owningRival =
        stableInfo && !stableInfo.isPlayer ? state.rivalMap?.get(stableInfo.stableId) : undefined;
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

/**
 * Weather-skepticism pre-gate: verifyBoutAcceptance runs before the full
 * evaluation — title offers are flagged so crown obligations bypass the soft
 * gates. Returns true when the warrior declined (impact applied).
 */
function weatherGateDeclined(
  state: GameState,
  currentOffers: OfferMap,
  offer: BoutOffer,
  trackedOffer: BoutOffer,
  wId: WarriorId,
  owningRival: RivalStableData,
  rivalWarrior: Warrior,
  opponent: Warrior | undefined
): boolean {
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

/**
 * Applies a counter response (venue first, purse fallback) and returns true
 * when the counter resolved the offer — false for non-counter responses.
 */
function applyCounterResponse(
  response: string,
  state: GameState,
  currentOffers: OfferMap,
  offer: BoutOffer,
  trackedOffer: BoutOffer,
  owningRival: RivalStableData,
  rivalWarrior: Warrior,
  wId: WarriorId
): boolean {
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
      return true;
    }
    // No venue to counter toward — fall through to the purse counter.
  }

  if (response === 'Countered' || response === 'CounteredVenue') {
    // One negotiation round: sweeten the purse and re-pend the other side.
    const impact = counterBoutOffer(
      { ...state, boutOffers: currentOffers },
      offer.id as BoutOfferId,
      wId
    );
    applyOfferImpact(currentOffers, impact);
    return true;
  }
  return false;
}

/**
 * Resolves one warrior's response to one offer within a rival slate.
 * Returns true when the warrior is committed (accepted) this week.
 */
function respondForWarrior(
  state: GameState,
  currentOffers: OfferMap,
  offer: BoutOffer,
  wId: WarriorId,
  owningRival: RivalStableData,
  pickedWarriors: Set<string>
): void {
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
      state,
      currentOffers,
      offer,
      trackedOffer,
      wId,
      owningRival,
      rivalWarrior,
      opponent
    )
  ) {
    return;
  }

  const explain: { reason?: string } = {};
  const response = boutAcceptance.evaluateBoutOffer(
    trackedOffer,
    owningRival,
    rivalWarrior,
    state.absoluteWeek,
    state.weather as WeatherType,
    opponent,
    state,
    explain
  );

  if (response === 'Accepted') {
    pickedWarriors.add(wId);
  }

  if (
    applyCounterResponse(
      response,
      state,
      currentOffers,
      offer,
      trackedOffer,
      owningRival,
      rivalWarrior,
      wId
    )
  ) {
    return;
  }

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
      respondForWarrior(state, currentOffers, offer, wId, owningRival, pickedWarriors);
    });
  });
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
  rivalMap: Map<StableId | string, RivalStableData>
): void {
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
          opponent,
          state
        );
        // No second counter round — an already-countered offer is take it or leave it.
        final =
          verdict === 'Declined' || verdict === 'Countered' || verdict === 'CounteredVenue'
            ? 'Declined'
            : 'Accepted';
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
      applyOfferImpact(currentOffers, impact);
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

  // Group offers by stableId (each rival gets their weekly slate)
  const offersByRival = groupOffersByRival(state, pendingOffers);

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

  resolveCounteredOffers(state, currentOffers, rivalMap);

  return { boutOffers: currentOffers };
}
