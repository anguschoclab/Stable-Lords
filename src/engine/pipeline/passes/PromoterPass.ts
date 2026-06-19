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
 * Returns true if the warrior's style is heavily penalized by the current weather,
 * making them a poor choice for promoter matchmaking.
 */
function isWeatherDisadvantaged(warrior: Warrior, weather: WeatherType): boolean {
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) return true;
  if (weather === 'Dense Fog' && isLunger) return true;
  if (weather === 'Blizzard' && (isLunger || warrior.attributes.CN < 12)) return true;
  if (weather === 'Sandstorm' && (isLunger || warrior.style === FightingStyle.AimedBlow)) return true;
  if (weather === 'Gale' && (warrior.style === FightingStyle.StrikingAttack || isLunger)) return true;
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

    // Attempt to fill capacity (use weather-suitable warriors)
    const shuffledWarriors = rngService.shuffle(weatherSuitableWarriors);

    // Get personality-specific gap threshold
    const gapThreshold = PERSONALITY_GAP_THRESHOLDS[promoter.personality] ?? 0.25;

    for (const warriorA of shuffledWarriors) {
      if (generated >= capacity) break;

      const rankDataA = rankings[warriorA.id];
      const rankA = rankDataA?.overallRank ?? 999;
      if (rankA > RANK_REQUIREMENTS[promoter.tier]) continue;

      // Find an opponent B with personality-based matching
      const scoreA = rankDataA?.compositeScore ?? 0;
      const maxScoreA = Math.max(1, scoreA);

      // Optimized candidate selection: single pass with inline scoring
      // Avoids multiple array allocations (filter + map + sort)
      let bestCandidate: Warrior | null = null;
      let bestScore = -Infinity;

      for (const candidate of shuffledWarriors) {
        if (candidate.id === warriorA.id) continue;

        const rankDataB = rankings[candidate.id];
        const rankB = rankDataB?.overallRank ?? 999;
        if (rankB > RANK_REQUIREMENTS[promoter.tier]) continue;

        const scoreB = rankDataB?.compositeScore ?? 0;
        const gap = Math.abs(scoreA - scoreB) / maxScoreA;
        if (gap > gapThreshold) continue;

        const personalityScore = calculatePersonalityMatchScore(warriorA, candidate, promoter);

        // Calculate composite score for comparison
        let candidateScore: number;
        if (promoter.personality === 'Greedy') {
          // Greedy prefers bigger gaps
          candidateScore = gap * 100 + personalityScore;
        } else {
          // Others: personality score first, then tighter gap
          candidateScore = personalityScore * 100 - gap;
        }

        if (candidateScore > bestScore) {
          bestScore = candidateScore;
          bestCandidate = candidate;
        }
      }

      const opponentB = bestCandidate;

      if (opponentB) {
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
