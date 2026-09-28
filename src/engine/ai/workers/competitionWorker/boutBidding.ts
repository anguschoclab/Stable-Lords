import type {
  GameState,
  RivalStableData,
  WeatherType,
  BoutOffer,
  Warrior,
  RestState,
  TrainingAssignment,
} from '@/types/state.types';
import type { BoutOfferId, PromoterId, StableId, WarriorId } from '@/types/shared.types';
import { type CrowdMood } from '@/engine/bout/crowdMood';
import { scorePairwiseMatchup, type PairwiseHeadToHead } from '@/engine/matchmaking/schedulingAssistant';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';
import { weatherBidModifier } from '@/engine/ai/weatherSuitability';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { BoutBid } from './types';

export const BID_MATCHMAKING_ID = 'BID_MATCHMAKING' as PromoterId;
import { displayWeek, boutOfferAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { computeRivalReputation } from '@/engine/stable/stableReputation';
import { clamp } from '@/utils/math';
import { isActive, isBookable } from '@/engine/warrior/warriorStatus';
import {
  isChampionBookingLocked,
  CHAMPIONSHIP_EXCLUDED_ARENAS,
} from '@/engine/championship/arenaChampionship';
import { ARENA_TITLE } from '@/constants/arena';

/** Player-bound offer caps: ≤1 per proposing stable, ≤3 globally per week. */
export const MAX_PLAYER_OFFERS_PER_RIVAL = 1;
export const MAX_PLAYER_OFFERS_GLOBAL = 3;
/** Priority bonus for a rival warrior the player has marked as a challenge. */
const CHALLENGED_BID_BONUS = 3;

/**
 * Whether a warrior is free to be booked: active, uninjured, and not holding
 * a training assignment on its owning stable's list (G19 — rival assignment
 * lists are consulted for rival-owned warriors).
 */
function bookable(
  warrior: Warrior,
  opts: {
    trainingAssignments: TrainingAssignment[] | undefined;
    restStates?: RestState[] | undefined;
    targetWeek: number;
  }
): boolean {
  return isBookable(warrior, {
    restStates: opts.restStates ?? [],
    trainingAssignments: opts.trainingAssignments ?? [],
    targetWeek: opts.targetWeek,
  });
}

/**
 * Generate bout bids for a rival stable. When `state` is supplied the agent is
 * player-aware: vendettas may target the player roster, the player's
 * challenge/avoid marks steer contact, and per-stable training assignments
 * suppress bids.
 */
export function generateBoutBids(
  rival: RivalStableData,
  _currentWeek: number,
  weather: WeatherType = 'Clear',
  crowdMood: CrowdMood = 'Calm',
  rivals: RivalStableData[] = [],
  state?: GameState
): { bids: BoutBid[]; updatedRival: RivalStableData } {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';
  const assignedIds = new Set((rival.trainingAssignments ?? []).map((a) => a.warriorId));
  // Warriors already committed to a signed upcoming bout don't re-enter the
  // pool — a signed title shot (or any booked fight) shouldn't double-book.
  const signedIds = new Set<string>();
  if (state) {
    const now = state.absoluteWeek ?? state.week;
    for (const offer of Object.values(state.boutOffers ?? {})) {
      if (offer.status !== 'Signed') continue;
      if (boutOfferAbsoluteWeek(offer) <= now) continue;
      for (const wId of offer.warriorIds) signedIds.add(wId as string);
    }
  }
  const activeRoster = rival.roster.filter(
    (w) =>
      isActive(w) &&
      !assignedIds.has(w.id) &&
      !signedIds.has(w.id) &&
      // Booking-locked arena champions only fight title bouts.
      !(state && isChampionBookingLocked(state, w.id))
  );
  const bids: BoutBid[] = [];

  // Pre-calculate vendetta target once outside the loop to prevent O(W * R) lookups
  const targetStableId = rival.strategy?.targetStableId;
  const targetIsPlayer =
    state !== undefined && targetStableId !== undefined && targetStableId === state.player.id;
  const targetRival =
    intent === 'VENDETTA' && targetStableId && !targetIsPlayer
      ? rivals.find((r) => r.id === targetStableId || r.owner.id === targetStableId)
      : undefined;

  // Player warriors the vendetta may target (active only; booking filtered at conversion)
  const playerTargets: Warrior[] =
    intent === 'VENDETTA' && targetIsPlayer && state
      ? state.roster.filter((w) => isActive(w) && !isChampionBookingLocked(state, w.id))
      : [];

  // Pre-calculate active opponents for non-vendetta intents — booking-locked
  // champions are excluded as bid targets as well as proposers.
  const nonVendettaOpponents: typeof rival.roster = [];
  if (intent !== 'VENDETTA') {
    for (const r of rivals) {
      if (r.id === rival.id) continue;
      for (const w of r.roster) {
        if (isActive(w) && !(state && isChampionBookingLocked(state, w.id)))
          nonVendettaOpponents.push(w);
      }
    }
  }

  for (const warrior of activeRoster) {
    const weatherModifier = weatherBidModifier(warrior, weather);

    // Crowd Pandering
    let moodModifier = 0;
    const personality = rival.owner.personality ?? 'Pragmatic';
    if (crowdMood === 'Bloodthirsty' && personality === 'Aggressive') moodModifier = +3;
    if (crowdMood === 'Theatrical' && personality === 'Showman') moodModifier = +3;

    // Scheduling Assistant: matchup scoring (pairwise — no player semantics, G18)
    let matchupModifier = -Infinity;
    let foundOpponent = false;
    if (intent === 'VENDETTA' && rival.strategy?.targetStableId) {
      const targetPool = targetIsPlayer ? playerTargets : (targetRival?.roster ?? []);
      for (const opponent of targetPool) {
        if (!isActive(opponent)) continue;
        if (state && isChampionBookingLocked(state, opponent.id)) continue;
        const matchupScore = scorePairwiseMatchup(warrior, opponent, {
          aStableId: (warrior.stableId ?? rival.id) as string,
          bStableId: targetIsPlayer && state
            ? (state.player.id as string)
            : ((opponent.stableId ?? targetStableId) as string),
        });
        const score = clamp((matchupScore - 100) / 20, -5, 5);
        matchupModifier = Math.max(matchupModifier, score);
        foundOpponent = true;
      }
    } else if (intent !== 'VENDETTA') {
      for (const opponent of nonVendettaOpponents) {
        const matchupScore = scorePairwiseMatchup(warrior, opponent, {
          aStableId: (warrior.stableId ?? rival.id) as string,
          bStableId: opponent.stableId as string,
        });
        const score = clamp((matchupScore - 100) / 20, -5, 5);
        matchupModifier = Math.max(matchupModifier, score);
        foundOpponent = true;
      }
    }
    if (!foundOpponent) matchupModifier = 0;

    const warriorIsChallenged = state !== undefined && state.playerChallenges?.includes(warrior.id);
    const warriorIsAvoided = state !== undefined && state.playerAvoids?.includes(warrior.id);

    if (intent === 'VENDETTA' && rival.strategy?.targetStableId) {
      // Player-bound vendetta: the player's avoid list vetoes this warrior.
      if (targetIsPlayer && warriorIsAvoided) continue;
      bids.push({
        proposingWarriorId: warrior.id,
        targetStableId: rival.strategy.targetStableId,
        priority: Math.max(1, 10 + weatherModifier + moodModifier + matchupModifier),
        description: `Vendetta target. ${weatherModifier < 0 ? '(Weather caution)' : weatherModifier > 0 ? '(Weather advantage)' : ''} ${matchupModifier > 0 ? '(Favorable matchup)' : matchupModifier < 0 ? '(Unfavorable matchup)' : ''}`,
      });
    } else if (intent === 'VENDETTA') {
      continue;
    } else if (
      intent === 'CROWN_CAMPAIGN' &&
      rival.strategy?.targetArenaId &&
      rival.agentMemory?.crownAssessment?.warriorId === warrior.id
    ) {
      // The campaign warrior's ordinary bookings are pinned to the target
      // arena — every venue bout there feeds contender ranking.
      bids.push({
        proposingWarriorId: warrior.id,
        arenaId: rival.strategy.targetArenaId,
        priority: Math.max(1, 9 + weatherModifier + moodModifier + matchupModifier),
        description: `Crown campaign — climbing the ladder at ${rival.strategy.targetArenaId}.`,
      });
    } else if (warriorIsChallenged && state && !warriorIsAvoided) {
      // The player publicly challenged this warrior — the stable answers.
      bids.push({
        proposingWarriorId: warrior.id,
        targetStableId: state.player.id,
        priority: Math.max(
          1,
          8 + weatherModifier + moodModifier + matchupModifier + CHALLENGED_BID_BONUS
        ),
        description: 'Answering the challenge the player issued.',
      });
    } else if (intent === 'RECOVERY') {
      if (weatherModifier < -2) continue;
      bids.push({
        proposingWarriorId: warrior.id,
        maxFame: 50,
        priority: Math.max(1, 5 + moodModifier + matchupModifier),
        description: 'Seeking low-risk recovery bout.',
      });
    } else if (intent === 'EXPANSION') {
      bids.push({
        proposingWarriorId: warrior.id,
        minFame: 100,
        priority: Math.max(1, 7 + weatherModifier + moodModifier + matchupModifier),
        description: 'Seeking high-visibility expansion bout.',
      });
    } else {
      bids.push({
        proposingWarriorId: warrior.id,
        priority: Math.max(1, 4 + weatherModifier + moodModifier + matchupModifier),
        description: 'Standard training bout.',
      });
    }
  }

  return { bids, updatedRival: rival };
}

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
    // All other intents: search all rival stables
    for (const rival of rivals) {
      if (rival.id === proposerStable.stableId || rival.owner.id === proposerStable.stableId)
        continue;
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

/** Picks the highest-scoring candidate opponent (pairwise; h2h memoized). */
function pickBestCandidate(
  proposer: Warrior,
  candidates: { warrior: Warrior; stableId: string }[],
  proposerStableId: string,
  cx: BidConversionCtx
): { warrior: Warrior; stableId: string } | undefined {
  const { state } = cx;
  let bestCandidate = candidates[0];
  if (!bestCandidate) return undefined;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const score = scorePairwiseMatchup(proposer, candidate.warrior, {
      rankings: state.realmRankings,
      arenaHistory: state.arenaHistory,
      rivalries: state.rivalries,
      rivalryMap: state.rivalryMap,
      aStableId: proposerStableId,
      bStableId: candidate.stableId,
      week: state.week,
      h2hCache: cx.h2hCache,
    });
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
    })
  );
}

/** Builds the BoutOffer record for a matched bid pair. */
function buildOffer(
  bid: BoutBid,
  proposer: Warrior,
  opponent: Warrior,
  proposerStable: { stableId: string; isPlayer: boolean },
  arenaId: string | undefined,
  cx: BidConversionCtx
): BoutOffer {
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
      Math.floor((proposer.fame ?? 50) + (opponent.fame ?? 50)) +
        bid.priority * 5 +
        notorietyHype
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

    // The player's avoid list vetoes the proposer for player-bound offers.
    if (bidTargetsPlayer && cx.playerAvoidSet.has(bid.proposingWarriorId)) continue;

    // Player-bound caps: ≤1 per proposing stable, ≤3 globally.
    if (bidTargetsPlayer) {
      if (cx.playerOfferTotal >= MAX_PLAYER_OFFERS_GLOBAL) continue;
      if ((cx.playerOffersByStable.get(proposerStable.stableId) ?? 0) >= MAX_PLAYER_OFFERS_PER_RIVAL)
        continue;
    }

    // Find candidate opponents based on bid criteria
    let candidates = collectCandidates(bid, cx, proposerStable, rivals);
    candidates = fameFilter(candidates, bid, cx.paired);
    if (candidates.length === 0) continue;

    // Pick the best matchup opponent (pairwise — player marks never leak, G18)
    const bestCandidate = pickBestCandidate(proposer, candidates, proposerStable.stableId, cx);
    if (!bestCandidate) continue;
    const opponent = bestCandidate.warrior;

    const arenaId = resolveArenaId(bid, proposer, opponent, cx);
    const offer = buildOffer(bid, proposer, opponent, proposerStable, arenaId, cx);

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
