import { GameState, Warrior } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import type { BoutOfferId, WeatherType } from '@/types/shared.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/utils/random';
import { FIGHT_PURSE } from '@/constants/economy';
import { collectAllActiveWarriors } from '@/engine/core/warriorCollection';
import {
  TIER_MULTIPLIERS,
  RANK_REQUIREMENTS,
  PERSONALITY_GAP_THRESHOLDS,
} from '@/engine/promoters/promoterConfig';
import {
  calculatePersonalityMatchScore,
  calculatePersonalityPurseModifier,
} from '@/engine/promoters/personalityScoring';
import { calculateHype } from '@/engine/promoters/hypeCalculator';
import { selectArenaForMatchup } from '@/engine/matchmaking/arenaFit';

/**
 * Binary search: returns the first index where arr[index] >= target.
 * If all elements are < target, returns arr.length.
 */
export function lowerBound(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid]! < target) {
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
    if (arr[mid]! <= target) {
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
function isWeatherDisadvantaged(warrior: Warrior, weather: WeatherType): boolean {
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
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */

/**
 *
 */
export function runPromoterPass(state: GameState, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(state.week * 881 + 17);
  const rankings = state.realmRankings || {};

  // 0. Garbage Collection: Prune expired or stale bout offers
  const newOffers: typeof state.boutOffers = {};
  for (const key in state.boutOffers) {
    const offer = state.boutOffers[key as BoutOfferId];
    if (!offer) continue;
    const isPast = offer.boutWeek < state.week;
    const isExpired = offer.expirationWeek < state.week && offer.status !== 'Signed';
    if (!isPast && !isExpired) {
      newOffers[key as BoutOfferId] = offer;
    }
  }

  // 1. Gather all active warriors using utility
  const allWarriors = collectAllActiveWarriors(state);

  // ⚡ Bolt: Pre-compute available warriors to avoid repeated availability checks
  // Available = No SIGNED or PROPOSED bout for Week+2 or Week+3
  const targetWeek = state.week + 2; // Forward booking
  const unavailableWarriorIds = new Set<string>();
  Object.values(newOffers).forEach((o) => {
    const isBooked =
      (o.status === 'Signed' || o.status === 'Proposed') &&
      (o.boutWeek === targetWeek || o.boutWeek === targetWeek + 1);
    if (isBooked) {
      o.warriorIds.forEach((id) => unavailableWarriorIds.add(id));
    }
  });

  // 🔒 Tournament Lock: On tournament weeks, exclude warriors in active tournaments
  if (state.isTournamentWeek) {
    const tournamentLockedIds = new Set<string>();
    state.tournaments?.forEach((t) => {
      if (!t.completed) {
        t.participants?.forEach((p) => tournamentLockedIds.add(p.id));
      }
    });
    tournamentLockedIds.forEach((id) => unavailableWarriorIds.add(id));
  }

  const availableWarriors = allWarriors.filter((warrior) => !unavailableWarriorIds.has(warrior.id));

  // Gap 10: Filter out warriors whose style is heavily penalized by current weather
  const weather = (state.weather ?? 'Clear') as WeatherType;
  const weatherSuitableWarriors = availableWarriors.filter(
    (w) => !isWeatherDisadvantaged(w, weather)
  );

  // Pre-build a set of player warrior ids for arena-selection favour weighting
  const playerWarriorIds = new Set((state.roster || []).map((w) => w.id));

  // 2. Iterate through Promoters
  Object.values(state.promoters || []).forEach((promoter) => {
    const capacity = promoter.capacity;
    let generated = 0;

    // Shuffle full array first (preserves RNG state consumption)
    const shuffledWarriors = rngService.shuffle(weatherSuitableWarriors);

    // Post-shuffle rank filter (RNG-free)
    const rankReq = RANK_REQUIREMENTS[promoter.tier];
    const shuffledEligible = shuffledWarriors.filter(
      (w) => (rankings[w.id]?.overallRank ?? 999) <= rankReq
    );

    if (shuffledEligible.length < 2) return;

    // Get personality-specific gap threshold
    const gapThreshold = PERSONALITY_GAP_THRESHOLDS[promoter.personality] ?? 0.25;

    // Build score-sorted array for binary-search windowing
    const scoreOf = (w: Warrior) => rankings[w.id]?.compositeScore ?? 0;
    const sortedByScore = [...shuffledEligible].sort((a, b) => scoreOf(a) - scoreOf(b));
    const sortedScores = sortedByScore.map((w) => scoreOf(w));

    // Track matched warriors to prevent reuse within this promoter's pass
    const matchedIds = new Set<string>();

    for (const warriorA of shuffledEligible) {
      if (generated >= capacity) break;
      if (matchedIds.has(warriorA.id)) continue;

      const scoreA = scoreOf(warriorA);
      const maxScoreA = Math.max(1, scoreA);

      // Compute score window for gap threshold
      const minScoreB = scoreA - gapThreshold * maxScoreA;
      const maxScoreB = scoreA + gapThreshold * maxScoreA;

      // Binary search to find the contiguous window in sortedByScore
      const lo = lowerBound(sortedScores, minScoreB);
      const hi = upperBound(sortedScores, maxScoreB);

      let bestCandidate: Warrior | null = null;
      let bestScore = -Infinity;

      for (let i = lo; i < hi; i++) {
        const candidate = sortedByScore[i]!;
        if (candidate.id === warriorA.id) continue;
        if (matchedIds.has(candidate.id)) continue;

        const scoreB = sortedScores[i]!;
        const gap = Math.abs(scoreA - scoreB) / maxScoreA;

        const personalityScore = calculatePersonalityMatchScore(warriorA, candidate, promoter);

        let candidateScore: number;
        if (promoter.personality === 'Greedy') {
          candidateScore = gap * 100 + personalityScore;
        } else {
          candidateScore = personalityScore * 100 - gap;
        }

        if (candidateScore > bestScore) {
          bestScore = candidateScore;
          bestCandidate = candidate;
        }
      }

      const opponentB = bestCandidate;

      if (opponentB) {
        matchedIds.add(warriorA.id);
        matchedIds.add(opponentB.id);

        const offerId = rngService.uuid();
        const hype = calculateHype(warriorA, opponentB, promoter);
        const basePurse = FIGHT_PURSE * TIER_MULTIPLIERS[promoter.tier];
        const purseModifier = calculatePersonalityPurseModifier(
          warriorA,
          opponentB,
          promoter,
          hype
        );
        const finalPurse = Math.floor(basePurse * (hype / 100) * purseModifier);

        // Favour the player's warrior when selecting arena fit
        const isWarriorAPlayer = playerWarriorIds.has(warriorA.id);
        const favorWarrior = isWarriorAPlayer ? warriorA : opponentB;
        const otherWarrior = isWarriorAPlayer ? opponentB : warriorA;
        const arenaId = selectArenaForMatchup(favorWarrior, otherWarrior, rngService, {
          favorWeight: 1.2,
          planA: favorWarrior.plan ?? undefined,
          planB: otherWarrior.plan ?? undefined,
        });

        const typedOfferId = offerId as BoutOfferId;
        newOffers[typedOfferId] = {
          id: typedOfferId,
          promoterId: promoter.id,
          warriorIds: [warriorA.id, opponentB.id],
          boutWeek: targetWeek,
          expirationWeek: state.week + 1,
          purse: finalPurse,
          hype,
          status: 'Proposed',
          responses: {
            [warriorA.id]: 'Pending',
            [opponentB.id]: 'Pending',
          },
          arenaId,
        };
        generated++;
      }
    }
  });

  return {
    boutOffers: newOffers,
  };
}
