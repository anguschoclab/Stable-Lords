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
import { type CrowdMood } from '@/engine/crowdMood';
import { scorePairwiseMatchup } from '@/engine/schedulingAssistant';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';
import { weatherBidModifier } from '@/engine/ai/weatherSuitability';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { BoutBid } from './types';

export const BID_MATCHMAKING_ID = 'BID_MATCHMAKING' as PromoterId;
import { displayWeek } from '@/engine/core/absoluteWeek';
import { clamp } from '@/utils/math';
import { isActive, isBookable } from '@/engine/warriorStatus';

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
  const activeRoster = rival.roster.filter((w) => isActive(w) && !assignedIds.has(w.id));
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
      ? state.roster.filter((w) => isActive(w))
      : [];

  // Pre-calculate active opponents for non-vendetta intents
  const nonVendettaOpponents: typeof rival.roster = [];
  if (intent !== 'VENDETTA') {
    for (const r of rivals) {
      if (r.id === rival.id) continue;
      for (const w of r.roster) {
        if (isActive(w)) nonVendettaOpponents.push(w);
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
export function convertBidsToOffers(
  allBids: { bid: BoutBid; rivalId: string }[],
  rivals: RivalStableData[],
  state: GameState,
  rng: IRNGService,
  existingOfferWarriorIds: Set<string>
): BoutOffer[] {
  const sorted = [...allBids].sort((a, b) => b.bid.priority - a.bid.priority);
  const paired = new Set<string>(existingOfferWarriorIds);
  // ⚡ Bolt Optimization: Using for...of loop instead of .map() to avoid tuple array allocation overhead.
  const rivalMap = new Map<string, RivalStableData>();
  const proposerById = new Map<string, Warrior>();
  for (const r of rivals) {
    rivalMap.set(r.id as string, r);
    if (r.owner.id !== r.id) rivalMap.set(r.owner.id as string, r);
    for (const w of r.roster) proposerById.set(w.id as string, w);
  }
  const offers: BoutOffer[] = [];
  const playerStableId = state.player.id as string;
  const targetWeek = state.absoluteWeek + 1;

  // Player-bound offer caps (offer spam protection).
  const playerOffersByStable = new Map<string, number>();
  let playerOfferTotal = 0;

  for (const { bid, rivalId } of sorted) {
    if (paired.has(bid.proposingWarriorId)) continue;

    const proposer =
      state.warriorMap?.get(bid.proposingWarriorId as WarriorId) ??
      proposerById.get(bid.proposingWarriorId);
    if (!proposer) continue;

    // The stable that generated the bid owns the proposer; the cache map is
    // a hot-path fast lookup, with the bid's rivalId as the ground truth.
    const proposerStable = state.warriorToStableMap?.get(bid.proposingWarriorId as WarriorId) ?? {
      stableId: rivalId,
      isPlayer: false,
    };

    const bidTargetsPlayer = bid.targetStableId === playerStableId;

    // The player's avoid list vetoes the proposer for player-bound offers.
    if (bidTargetsPlayer && (state.playerAvoids ?? []).includes(bid.proposingWarriorId)) continue;

    // Player-bound caps: ≤1 per proposing stable, ≤3 globally.
    if (bidTargetsPlayer) {
      if (playerOfferTotal >= MAX_PLAYER_OFFERS_GLOBAL) continue;
      if ((playerOffersByStable.get(proposerStable.stableId) ?? 0) >= MAX_PLAYER_OFFERS_PER_RIVAL)
        continue;
    }

    // Find candidate opponents based on bid criteria
    let candidates: { warrior: typeof proposer; stableId: string }[] = [];

    if (bidTargetsPlayer) {
      for (const w of state.roster) {
        if (!isActive(w)) continue;
        if (
          !bookable(w, {
            restStates: state.restStates,
            trainingAssignments: state.trainingAssignments,
            targetWeek,
          })
        )
          continue;
        candidates.push({ warrior: w, stableId: playerStableId });
      }
    } else if (bid.targetStableId) {
      // VENDETTA: target a specific rival stable
      const targetRival = rivalMap.get(bid.targetStableId);
      if (targetRival) {
        candidates = [];
        for (const w of targetRival.roster) {
          if (!isActive(w)) continue;
          if (
            !bookable(w, {
              restStates: state.restStates,
              trainingAssignments: targetRival.trainingAssignments,
              targetWeek,
            })
          )
            continue;
          candidates.push({ warrior: w, stableId: targetRival.id as string });
        }
      }
    } else {
      // All other intents: search all rival stables
      for (const rival of rivals) {
        if (rival.id === proposerStable.stableId || rival.owner.id === proposerStable.stableId)
          continue;
        for (const w of rival.roster) {
          if (w.status !== 'Active') continue;
          if (
            !bookable(w, {
              restStates: state.restStates,
              trainingAssignments: rival.trainingAssignments,
              targetWeek,
            })
          )
            continue;
          candidates.push({ warrior: w, stableId: rival.id as string });
        }
      }
    }

    // Apply fame filters
    candidates = candidates.filter((c) => {
      if (paired.has(c.warrior.id)) return false;
      if (bid.maxFame !== undefined && (c.warrior.fame ?? 0) > bid.maxFame) return false;
      if (bid.minFame !== undefined && (c.warrior.fame ?? 0) < bid.minFame) return false;
      return true;
    });

    if (candidates.length === 0) continue;

    // Pick the best matchup opponent (pairwise — player marks never leak, G18)
    let bestCandidate = candidates[0];
    if (!bestCandidate) continue;
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      const score = scorePairwiseMatchup(proposer, candidate.warrior, {
        rankings: state.realmRankings,
        arenaHistory: state.arenaHistory,
        rivalries: state.rivalries,
        rivalryMap: state.rivalryMap,
        aStableId: proposerStable.stableId as string,
        bStableId: candidate.stableId,
        week: state.week,
      });
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    const opponent = bestCandidate.warrior;
    const arenaId = selectArenaForMatchup(proposer, opponent, rng);
    const offerId = `bid_${rng.uuid()}` as BoutOfferId;

    const offer: BoutOffer = {
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
        Math.floor((proposer.fame ?? 50) + (opponent.fame ?? 50)) + bid.priority * 5
      ),
      status: 'Proposed',
      responses: {
        [bid.proposingWarriorId as WarriorId]: 'Accepted',
        [opponent.id as WarriorId]: 'Pending',
      },
      arenaId,
    };

    offers.push(offer);
    paired.add(bid.proposingWarriorId);
    paired.add(opponent.id);
    if (bidTargetsPlayer) {
      playerOfferTotal++;
      playerOffersByStable.set(
        proposerStable.stableId,
        (playerOffersByStable.get(proposerStable.stableId) ?? 0) + 1
      );
    }
  }

  return offers;
}
