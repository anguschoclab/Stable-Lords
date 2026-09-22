/**
 * Bout Offer Matchmaking
 * Helpers extracted from the Promoter Pass: stale-offer pruning, warrior
 * availability sets, score-windowed opponent search, and offer construction.
 */
import { GameState, Warrior, Promoter, BoutOffer } from '@/types/state.types';
import type { BoutOfferId, WeatherType } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { FIGHT_PURSE, MATCHMAKING_SCORE_CONSTANTS } from '@/constants/economy';
import { getPairKey } from '@/utils/keyUtils';
import { TIER_MULTIPLIERS } from '@/engine/promoters/promoterConfig';
import {
  calculatePersonalityMatchScore,
  calculatePersonalityPurseModifier,
} from '@/engine/promoters/personalityScoring';
import { calculateHype } from '@/engine/promoters/hypeCalculator';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';
import {
  displayWeek,
  boutOfferAbsoluteWeek,
  boutOfferExpirationAbsoluteWeek,
} from '@/engine/core/absoluteWeek';

/**
 * Binary search: returns the first index where arr[index] >= target.
 * If all elements are < target, returns arr.length.
 */
export function lowerBound(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((arr[mid] || 0) < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Binary search: returns the first index where arr[index] > target.
 * If all elements are <= target, returns arr.length.
 */
export function upperBound(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((arr[mid] || 0) <= target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Returns true if the warrior's style is heavily penalized by the current weather,
 * making them a poor choice for promoter matchmaking.
 */
export function isWeatherDisadvantaged(warrior: Warrior, weather: WeatherType): boolean {
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) return true;
  if (weather === 'Dense Fog' && isLunger) return true;
  if (weather === 'Blizzard' && (isLunger || warrior.attributes.CN < 12)) return true;
  if (weather === 'Sandstorm' && (isLunger || warrior.style === FightingStyle.AimedBlow))
    return true;
  if (weather === 'Gale' && (warrior.style === FightingStyle.StrikingAttack || isLunger))
    return true;
  if (weather === 'Tornado') return true;
  if (weather === 'Acid Rain') return true;
  return false;
}

/**
 * Garbage collection: returns the bout offers that are still live —
 * drops offers whose bout week has passed and expired unsigned offers.
 */
export function pruneStaleBoutOffers(state: GameState): GameState['boutOffers'] {
  const newOffers: GameState['boutOffers'] = {};
  for (const [key, offer] of Object.entries(state.boutOffers)) {
    if (!offer) continue;
    const isPast = boutOfferAbsoluteWeek(offer) < state.absoluteWeek;
    const isExpired =
      boutOfferExpirationAbsoluteWeek(offer) < state.absoluteWeek && offer.status !== 'Signed';

    if (!isPast && !isExpired) {
      newOffers[key as BoutOfferId] = offer;
    }
  }
  return newOffers;
}

/**
 * Builds the set of warrior ids unavailable for new bout offers: warriors
 * already Signed/Proposed for the target week (or the week after), plus —
 * on tournament weeks — every participant in an incomplete tournament.
 */
export function collectUnavailableWarriorIds(
  state: GameState,
  offers: GameState['boutOffers'],
  targetWeek: number
): Set<string> {
  const unavailableWarriorIds = new Set<string>();
  Object.values(offers).forEach((o) => {
    const isBooked =
      (o.status === 'Signed' || o.status === 'Proposed') &&
      (boutOfferAbsoluteWeek(o) === targetWeek || boutOfferAbsoluteWeek(o) === targetWeek + 1);
    if (isBooked) {
      o.warriorIds.forEach((id) => unavailableWarriorIds.add(id));
    }
  });

  if (state.isTournamentWeek) {
    state.tournaments?.forEach((t) => {
      if (!t.completed) {
        t.participants?.forEach((p) => unavailableWarriorIds.add(p.id));
      }
    });
  }
  return unavailableWarriorIds;
}

/**
 * Shared context for opponent scoring within a single promoter's pass.
 */
export interface OpponentSearchContext {
  promoter: Promoter;
  matchedIds: Set<string>;
  recentFightPairs: Set<string>;
  playerWarriorIds: Set<string>;
  avoidSet: Set<string>;
  challengeSet: Set<string>;
  gapThreshold: number;
}

/**
 * Scans the score-sorted candidate window around warriorA and returns the
 * best opponent for the promoter, or null when none are eligible.
 * Pure with respect to RNG — mutates nothing in ctx.
 */
export function findBestOpponent(
  warriorA: Warrior,
  scoreA: number,
  sortedByScore: Warrior[],
  sortedScores: number[],
  ctx: OpponentSearchContext
): Warrior | null {
  const maxScoreA = Math.max(1, scoreA);

  // Compute score window for gap threshold
  const minScoreB = scoreA - ctx.gapThreshold * maxScoreA;
  const maxScoreB = scoreA + ctx.gapThreshold * maxScoreA;

  // Binary search to find the contiguous window in sortedByScore
  const lo = lowerBound(sortedScores, minScoreB);
  const hi = upperBound(sortedScores, maxScoreB);

  let bestCandidate: Warrior | null = null;
  let bestScore = -Infinity;

  for (let i = lo; i < hi; i++) {
    const candidate = sortedByScore[i];
    if (!candidate) continue;
    if (candidate.id === warriorA.id) continue;
    if (ctx.matchedIds.has(candidate.id)) continue;
    if (ctx.recentFightPairs.has(getPairKey(warriorA.id, candidate.id))) continue;

    // Player avoid — skip avoided warriors when a player warrior is in the matchup
    if (ctx.playerWarriorIds.has(warriorA.id) && ctx.avoidSet.has(candidate.id)) continue;
    if (ctx.playerWarriorIds.has(candidate.id) && ctx.avoidSet.has(warriorA.id)) continue;

    const scoreB = sortedScores[i];
    if (scoreB === undefined) continue;
    const gap = Math.abs(scoreA - scoreB) / maxScoreA;

    const personalityScore = calculatePersonalityMatchScore(warriorA, candidate, ctx.promoter);

    let candidateScore: number;
    if (ctx.promoter.personality === 'Greedy') {
      candidateScore = gap * 100 + personalityScore;
    } else {
      candidateScore = personalityScore * 100 - gap;
    }

    // Player challenge — boost challenged warriors when a player warrior is in the matchup
    if (ctx.playerWarriorIds.has(warriorA.id) && ctx.challengeSet.has(candidate.id)) {
      candidateScore += MATCHMAKING_SCORE_CONSTANTS.CHALLENGE_BONUS;
    }
    if (ctx.playerWarriorIds.has(candidate.id) && ctx.challengeSet.has(warriorA.id)) {
      candidateScore += MATCHMAKING_SCORE_CONSTANTS.CHALLENGE_BONUS;
    }

    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

/**
 * Shared context for bout-offer construction within a pass.
 */
export interface OfferBuildContext {
  playerWarriorIds: Set<string>;
  weather: WeatherType;
}

/**
 * Constructs a Proposed bout offer for a matched pair: hype, purse
 * (tier-scaled, personality-adjusted), player-favored arena selection, and
 * pending responses. Consumes rngService.uuid() then selectArenaForMatchup.
 */
export function createBoutOffer(
  warriorA: Warrior,
  opponentB: Warrior,
  promoter: Promoter,
  state: GameState,
  rngService: IRNGService,
  ctx: OfferBuildContext
): BoutOffer {
  const offerId = rngService.uuid();
  const hype = calculateHype(warriorA, opponentB, promoter);
  const basePurse = FIGHT_PURSE * TIER_MULTIPLIERS[promoter.tier];
  const purseModifier = calculatePersonalityPurseModifier(warriorA, opponentB, promoter, hype);
  const finalPurse = Math.floor(basePurse * (hype / 100) * purseModifier);

  // Favour the player's warrior when selecting arena fit
  const isWarriorAPlayer = ctx.playerWarriorIds.has(warriorA.id);
  const favorWarrior = isWarriorAPlayer ? warriorA : opponentB;
  const otherWarrior = isWarriorAPlayer ? opponentB : warriorA;
  const arenaId = selectArenaForMatchup(favorWarrior, otherWarrior, rngService, {
    favorWeight: 1.2,
    arenaPool: promoter.arenaPool,
    planA: favorWarrior.plan ?? undefined,
    planB: otherWarrior.plan ?? undefined,
    weather: ctx.weather,
  });

  const typedOfferId = offerId as BoutOfferId;
  return {
    id: typedOfferId,
    promoterId: promoter.id,
    warriorIds: [warriorA.id, opponentB.id],
    boutWeek: displayWeek(state.absoluteWeek + 2),
    expirationWeek: displayWeek(state.absoluteWeek + 1),
    createdAbsoluteWeek: state.absoluteWeek,
    purse: finalPurse,
    hype,
    status: 'Proposed',
    responses: {
      [warriorA.id]: 'Pending',
      [opponentB.id]: 'Pending',
    },
    arenaId,
  };
}
