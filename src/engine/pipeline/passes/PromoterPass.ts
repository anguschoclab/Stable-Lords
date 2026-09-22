import { GameState, Warrior } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import type { WeatherType } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { resolveRng } from '@/utils/random';
import { collectAllWarriors } from '@/engine/core/warriorCollection';
import { isBookable } from '@/engine/warriorStatus';
import { buildRecentFightPairs } from '@/engine/core/historyUtils';
import { RANK_REQUIREMENTS, PERSONALITY_GAP_THRESHOLDS } from '@/engine/promoters/promoterConfig';
import {
  isWeatherDisadvantaged,
  pruneStaleBoutOffers,
  collectUnavailableWarriorIds,
  findBestOpponent,
  createBoutOffer,
} from '@/engine/promoters/offerMatchmaking';

/**
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */

/**
 *
 */
export function runPromoterPass(state: GameState, rng?: IRNGService): StateImpact {
  const rngService = resolveRng(rng, state.week * 881 + 17);
  const rankings = state.realmRankings || {};

  // 0. Garbage Collection: Prune expired or stale bout offers
  const newOffers = pruneStaleBoutOffers(state);

  // 1. Gather all bookable warriors (active, not resting, not too injured, not training)
  const targetWeek = state.absoluteWeek + 2; // Forward booking
  const allWarriors = collectAllWarriors(state, (w) =>
    isBookable(w, {
      restStates: state.restStates || [],
      trainingAssignments: state.trainingAssignments || [],
      targetWeek,
    })
  );

  // ⚡ Bolt: Pre-compute available warriors to avoid repeated availability checks
  // Available = No SIGNED or PROPOSED bout for Week+2 or Week+3
  // 🔒 Tournament Lock: On tournament weeks, exclude warriors in active tournaments
  const unavailableWarriorIds = collectUnavailableWarriorIds(state, newOffers, targetWeek);
  const availableWarriors = allWarriors.filter((warrior) => !unavailableWarriorIds.has(warrior.id));

  // Gap 10: Filter out warriors whose style is heavily penalized by current weather
  const weather = (state.weather ?? 'Clear') as WeatherType;
  const weatherSuitableWarriors = availableWarriors.filter(
    (w) => !isWeatherDisadvantaged(w, weather)
  );

  // Pre-build a set of player warrior ids for arena-selection favour weighting
  const playerWarriorIds = new Set<string>();
  for (const w of state.roster || []) playerWarriorIds.add(w.id);

  // Player challenge/avoid sets for bout offer biasing
  const challengeSet = new Set(state.playerChallenges || []);
  const avoidSet = new Set(state.playerAvoids || []);

  // Repeat-opponent avoidance: build set of warrior pairs that fought within last 4 weeks
  const recentFightPairs = buildRecentFightPairs(state.arenaHistory || [], state.absoluteWeek, 4);

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
    const sortedScores: number[] = new Array(sortedByScore.length);
    for (let i = 0; i < sortedByScore.length; i++) {
      const w = sortedByScore[i];
      if (w) sortedScores[i] = scoreOf(w);
    }

    // Track matched warriors to prevent reuse within this promoter's pass
    const matchedIds = new Set<string>();
    const searchCtx = {
      promoter,
      matchedIds,
      recentFightPairs,
      playerWarriorIds,
      avoidSet,
      challengeSet,
      gapThreshold,
    };
    const offerCtx = { playerWarriorIds, weather };

    for (const warriorA of shuffledEligible) {
      if (generated >= capacity) break;
      if (matchedIds.has(warriorA.id)) continue;

      const scoreA = scoreOf(warriorA);
      const opponentB = findBestOpponent(
        warriorA,
        scoreA,
        sortedByScore,
        sortedScores,
        searchCtx
      );

      if (opponentB) {
        matchedIds.add(warriorA.id);
        matchedIds.add(opponentB.id);

        const offer = createBoutOffer(warriorA, opponentB, promoter, state, rngService, offerCtx);
        newOffers[offer.id] = offer;
        generated++;
      }
    }
  });

  return {
    boutOffers: newOffers,
  };
}
