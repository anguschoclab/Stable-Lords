import type {
  GameState,
  RivalStableData,
  BoutOffer,
  Warrior,
  TrainingAssignment,
} from '@/types/state.types';
import type { BoutOfferId, StableId, WarriorId } from '@/types/shared.types';
import {
  scorePairwiseMatchup,
  type PairwiseHeadToHead,
} from '@/engine/matchmaking/schedulingAssistant';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { BoutBid } from '../types';
import { displayWeek } from '@/engine/core/absoluteWeek';
import { computeRivalReputation } from '@/engine/stable/stableReputation';
import { isActive } from '@/engine/warrior/warriorStatus';
import {
  isChampionBookingLocked,
  CHAMPIONSHIP_EXCLUDED_ARENAS,
} from '@/engine/championship/arenaChampionship';
import { ARENA_TITLE } from '@/constants/arena';
import { bookable } from './bookable';
import {
  BID_MATCHMAKING_ID,
  MAX_PLAYER_OFFERS_GLOBAL,
  MAX_PLAYER_OFFERS_PER_RIVAL,
  stableIsAvoided,
} from './generation';
import {
  AI_LEARN_SEEK_CAP,
  AI_LEARN_SEEK_GAP_DIVISOR,
  AI_LEARN_SEEK_MAX_BOUTS,
  AI_LEARN_SEEK_PERSONALITIES,
} from '@/constants/ai';
import {
  AI_DOWN_CHALLENGE_PENALTY,
  arenaIsHonorBound,
  isDownChallenge,
} from '@/engine/politics/honorCulture';

/**
 * Convert bids from all rivals into actual BoutOffer objects.
 * Sorts by priority (descending), finds matching opponents based on bid criteria,
 * and prevents double-booking warriors already in existing offers.
 * Player-bound bids (targetStableId === state.player.id) draw opponents from
 * the player roster and are capped per-rival and globally.
 */
/** Per-call lookup maps and memoized predicates for bid conversion. */
interface BidConversionCtx {
  state: GameState;
  rng: IRNGService;
  rivalMap: Map<string, RivalStableData>;
  proposerById: Map<string, Warrior>;
  paired: Set<string>;
  playerStableId: string;
  playerAvoidSet: Set<string>;
  playerStableAvoidSet: Set<string>;
  h2hCache: Map<string, PairwiseHeadToHead>;
  playerOffersByStable: Map<string, number>;
  playerOfferTotal: number;
  isBookableMemo: (w: Warrior, assignments: TrainingAssignment[] | undefined) => boolean;
}

/** Builds the per-call conversion context: lookup maps + bookable memo. */
function buildConversionCtx(
  state: GameState,
  rng: IRNGService,
  rivals: RivalStableData[],
  existingOfferWarriorIds: Set<string>
): BidConversionCtx {
  const paired = new Set<string>(existingOfferWarriorIds);
  // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
  const rivalMap = new Map<string, RivalStableData>();
  const proposerById = new Map<string, Warrior>();
  for (const r of rivals) {
    rivalMap.set(r.id as string, r);
    if (r.owner.id !== r.id) rivalMap.set(r.owner.id as string, r);
    for (const w of r.roster) proposerById.set(w.id as string, w);
  }
  const targetWeek = state.absoluteWeek + 1;

  // bookable() depends only on (warrior, restStates, trainingAssignments,
  // targetWeek) — all fixed for the call except the assignments list, which
  // varies per stable. Memoize per assignments-array to avoid re-running the
  // rest/assignment scans for every (bid × roster slot).
  const bookableMemo = new Map<TrainingAssignment[] | undefined, Map<string, boolean>>();
  const isBookableMemo = (w: Warrior, assignments: TrainingAssignment[] | undefined): boolean => {
    let m = bookableMemo.get(assignments);
    if (!m) {
      m = new Map();
      bookableMemo.set(assignments, m);
    }
    const cached = m.get(w.id as string);
    if (cached !== undefined) return cached;
    const v = bookable(w, {
      restStates: state.restStates,
      trainingAssignments: assignments,
      targetWeek,
    });
    m.set(w.id as string, v);
    return v;
  };

  return {
    state,
    rng,
    rivalMap,
    proposerById,
    paired,
    playerStableId: state.player.id as string,
    playerAvoidSet: new Set<string>(state.playerAvoids ?? []),
    playerStableAvoidSet: new Set<string>(state.playerStableAvoids ?? []),
    h2hCache: new Map<string, PairwiseHeadToHead>(),
    playerOffersByStable: new Map<string, number>(),
    playerOfferTotal: 0,
    isBookableMemo,
  };
}

/** Collects candidate opponent warriors matching the bid's target scope. */
function collectCandidates(
  bid: BoutBid,
  cx: BidConversionCtx,
  proposerStable: { stableId: string; isPlayer: boolean },
  rivals: RivalStableData[]
): { warrior: Warrior; stableId: string }[] {
  const { state } = cx;
  let candidates: { warrior: Warrior; stableId: string }[] = [];

  if (bid.targetStableId === cx.playerStableId) {
    for (const w of state.roster) {
      if (!isActive(w)) continue;
      if (isChampionBookingLocked(state, w.id)) continue;
      if (!cx.isBookableMemo(w, state.trainingAssignments)) continue;
      candidates.push({ warrior: w, stableId: cx.playerStableId });
    }
  } else if (bid.targetStableId) {
    // VENDETTA: target a specific rival stable
    const targetRival = cx.rivalMap.get(bid.targetStableId);
    if (targetRival) {
      candidates = [];
      for (const w of targetRival.roster) {
        if (!isActive(w)) continue;
        if (isChampionBookingLocked(state, w.id)) continue;
        if (!cx.isBookableMemo(w, targetRival.trainingAssignments)) continue;
        candidates.push({ warrior: w, stableId: targetRival.id as string });
      }
    }
  } else {
    // All other intents: search all rival stables — minus stables the
    // proposer's dossier says it is dominated by (stable-level avoid).
    const proposerRival = cx.rivalMap.get(proposerStable.stableId);
    for (const rival of rivals) {
      if (rival.id === proposerStable.stableId || rival.owner.id === proposerStable.stableId)
        continue;
      if (stableIsAvoided(proposerRival, rival, state.ownerGrudges)) continue;
      for (const w of rival.roster) {
        if (!isActive(w)) continue;
        if (isChampionBookingLocked(state, w.id)) continue;
        if (!cx.isBookableMemo(w, rival.trainingAssignments)) continue;
        candidates.push({ warrior: w, stableId: rival.id as string });
      }
    }
  }
  return candidates;
}

/** Filters candidates by pairing exclusivity and the bid's fame band. */
function fameFilter(
  candidates: { warrior: Warrior; stableId: string }[],
  bid: BoutBid,
  paired: Set<string>
): { warrior: Warrior; stableId: string }[] {
  return candidates.filter((c) => {
    if (paired.has(c.warrior.id)) return false;
    if (bid.maxFame !== undefined && (c.warrior.fame ?? 0) > bid.maxFame) return false;
    if (bid.minFame !== undefined && (c.warrior.fame ?? 0) < bid.minFame) return false;
    return true;
  });
}

const careerBouts = (w: Warrior): number =>
  (w.career?.wins ?? 0) + (w.career?.losses ?? 0);

/**
 * Canon "challenge a very experienced warrior" to learn: young warriors of
 * studious personalities get a score bonus toward more seasoned opponents.
 */
function learningSeekBonus(
  proposer: Warrior,
  candidate: Warrior,
  proposerStable: RivalStableData | undefined
): number {
  if (!proposerStable) return 0;
  if (!AI_LEARN_SEEK_PERSONALITIES.has(proposerStable.owner.personality ?? '')) return 0;
  if (careerBouts(proposer) >= AI_LEARN_SEEK_MAX_BOUTS) return 0;
  const gap = careerBouts(candidate) - careerBouts(proposer);
  if (gap <= 0) return 0;
  return Math.min(AI_LEARN_SEEK_CAP, Math.floor(gap / AI_LEARN_SEEK_GAP_DIVISOR));
}

/** Picks the highest-scoring candidate opponent (pairwise; h2h memoized). */
function pickBestCandidate(
  proposer: Warrior,
  candidates: { warrior: Warrior; stableId: string }[],
  proposerStableId: string,
  cx: BidConversionCtx,
  bid: BoutBid
): { warrior: Warrior; stableId: string } | undefined {
  const { state } = cx;
  const proposerRival = cx.rivalMap.get(proposerStableId);
  let bestCandidate = candidates[0];
  if (!bestCandidate) return undefined;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    // Arena honor culture: down-challenges draw stigma in honor-bound venues.
    const venue = resolveArenaId(bid, proposer, candidate.warrior, cx);
    const dishonorPenalty =
      arenaIsHonorBound(venue) && isDownChallenge(proposer, candidate.warrior)
        ? AI_DOWN_CHALLENGE_PENALTY
        : 0;
    const score =
      scorePairwiseMatchup(proposer, candidate.warrior, {
        rankings: state.realmRankings,
        arenaHistory: state.arenaHistory,
        rivalries: state.rivalries,
        rivalryMap: state.rivalryMap,
        aStableId: proposerStableId,
        bStableId: candidate.stableId,
        week: state.week,
        h2hCache: cx.h2hCache,
      }) +
      learningSeekBonus(proposer, candidate.warrior, proposerRival) -
      dishonorPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }
  return bestCandidate;
}

/**
 * Contender-venue bias: a warrior with a qualifying record at an arena is
 * climbing that venue's title ladder — their bids keep booking there so a
 * real contender emerges instead of diffusing across the circuit.
 */
function resolveArenaId(
  bid: BoutBid,
  proposer: Warrior,
  opponent: Warrior,
  cx: BidConversionCtx
): string | undefined {
  let contenderVenue: string | undefined;
  let contenderVenueWins = -1;
  for (const [venueId, rec] of Object.entries(proposer.career?.byArena ?? {})) {
    if (CHAMPIONSHIP_EXCLUDED_ARENAS.has(venueId)) continue;
    if ((rec.wins ?? 0) + (rec.losses ?? 0) < ARENA_TITLE.MIN_BOUTS) continue;
    if ((rec.wins ?? 0) > contenderVenueWins) {
      contenderVenue = venueId;
      contenderVenueWins = rec.wins ?? 0;
    }
  }
  return (
    bid.arenaId ??
    contenderVenue ??
    selectArenaForMatchup(proposer, opponent, cx.rng, {
      weather: cx.state.weather,
      arenaHistory: cx.state.arenaHistory,
      currentWeek: cx.state.absoluteWeek,
    })
  );
}

interface BuildOfferArgs {
  bid: BoutBid;
  proposer: Warrior;
  opponent: Warrior;
  proposerStable: { stableId: string; isPlayer: boolean };
  arenaId: string | undefined;
  cx: BidConversionCtx;
}

/** Builds the BoutOffer record for a matched bid pair. */
function buildOffer(args: BuildOfferArgs): BoutOffer {
  const { bid, proposer, opponent, proposerStable, arenaId } = args;
  const { cx } = args;
  const { state, rng } = cx;
  const offerId = `bid_${rng.uuid()}` as BoutOfferId;

  // Stable notoriety sells tickets — butcher stables draw a bigger crowd.
  const proposerRoster = proposerStable.isPlayer
    ? state.roster
    : cx.rivalMap.get(proposerStable.stableId)?.roster;
  const notorietyHype = proposerRoster
    ? Math.floor(computeRivalReputation(proposerRoster).notoriety / 2)
    : 0;

  return {
    id: offerId,
    promoterId: BID_MATCHMAKING_ID,
    proposerStableId: proposerStable.stableId as StableId,
    warriorIds: [bid.proposingWarriorId as WarriorId, opponent.id as WarriorId],
    boutWeek: displayWeek(state.absoluteWeek + 2),
    expirationWeek: displayWeek(state.absoluteWeek + 1),
    createdAbsoluteWeek: state.absoluteWeek,
    purse: Math.max(50, Math.floor((proposer.fame ?? 50) + (opponent.fame ?? 50))),
    hype: Math.max(
      40,
      Math.floor((proposer.fame ?? 50) + (opponent.fame ?? 50)) + bid.priority * 5 + notorietyHype
    ),
    status: 'Proposed',
    responses: {
      [bid.proposingWarriorId as WarriorId]: 'Accepted',
      [opponent.id as WarriorId]: 'Pending',
    },
    arenaId,
  };
}
/** Converts arena bids into bout offers the player stable can evaluate. */
export function convertBidsToOffers(
  allBids: { bid: BoutBid; rivalId: string }[],
  rivals: RivalStableData[],
  state: GameState,
  rng: IRNGService,
  existingOfferWarriorIds: Set<string>
): BoutOffer[] {
  const cx = buildConversionCtx(state, rng, rivals, existingOfferWarriorIds);
  const sorted = [...allBids].sort((a, b) => b.bid.priority - a.bid.priority);
  const offers: BoutOffer[] = [];
  for (const { bid, rivalId } of sorted) {
    if (cx.paired.has(bid.proposingWarriorId)) continue;

    const proposer =
      state.warriorMap?.get(bid.proposingWarriorId as WarriorId) ??
      cx.proposerById.get(bid.proposingWarriorId);
    if (!proposer) continue;
    // Booking-locked arena champions only fight title bouts — a stale bid
    // generated before a title went pending must not produce an offer.
    if (isChampionBookingLocked(state, proposer.id)) continue;

    // The stable that generated the bid owns the proposer; the cache map is
    // a hot-path fast lookup, with the bid's rivalId as the ground truth.
    const proposerStable = state.warriorToStableMap?.get(bid.proposingWarriorId as WarriorId) ?? {
      stableId: rivalId,
      isPlayer: false,
    };

    const bidTargetsPlayer = bid.targetStableId === cx.playerStableId;

    // The player's avoid lists veto the proposer for player-bound offers —
    // warrior-level marks and stable-level avoids alike.
    if (
      bidTargetsPlayer &&
      (cx.playerAvoidSet.has(bid.proposingWarriorId) ||
        cx.playerStableAvoidSet.has(proposerStable.stableId))
    )
      continue;

    // Player-bound caps: ≤1 per proposing stable, ≤3 globally.
    if (bidTargetsPlayer) {
      if (cx.playerOfferTotal >= MAX_PLAYER_OFFERS_GLOBAL) continue;
      if (
        (cx.playerOffersByStable.get(proposerStable.stableId) ?? 0) >= MAX_PLAYER_OFFERS_PER_RIVAL
      )
        continue;
    }

    // Find candidate opponents based on bid criteria
    let candidates = collectCandidates(bid, cx, proposerStable, rivals);
    candidates = fameFilter(candidates, bid, cx.paired);
    if (candidates.length === 0) continue;

    // Pick the best matchup opponent (pairwise — player marks never leak)
    const bestCandidate = pickBestCandidate(
      proposer,
      candidates,
      proposerStable.stableId,
      cx,
      bid
    );
    if (!bestCandidate) continue;
    const opponent = bestCandidate.warrior;

    const arenaId = resolveArenaId(bid, proposer, opponent, cx);
    const offer = buildOffer({
      bid: bid,
      proposer: proposer,
      opponent: opponent,
      proposerStable: proposerStable,
      arenaId: arenaId,
      cx: cx,
    });

    offers.push(offer);
    cx.paired.add(bid.proposingWarriorId);
    cx.paired.add(opponent.id);
    if (bidTargetsPlayer) {
      cx.playerOfferTotal++;
      cx.playerOffersByStable.set(
        proposerStable.stableId,
        (cx.playerOffersByStable.get(proposerStable.stableId) ?? 0) + 1
      );
    }
  }

  return offers;
}
