import { GameState, Promoter, Warrior, PromoterPersonality } from '@/types/state.types';
import { StateImpact } from '@/engine/impacts';
import { FightingStyle, type BoutOfferId } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { SeededRNGService } from '@/engine/core/rng/SeededRNGService';
import { FIGHT_PURSE } from '@/data/economyConstants';
import { collectAllActiveWarriors } from '@/engine/core/warriorCollection';
/**
 * Stable Lords — Promoter Pass
 * Phase 2: Promoters scan the world and dispatch bout offers.
 * Logic incorporates Hype Matrix, Rank Requirements, and Personality biases.
 */

const TIER_MULTIPLIERS = {
  Local: 1.0,
  Regional: 1.8,
  National: 3.5,
  Legendary: 8.0,
};

const RANK_REQUIREMENTS = {
  Local: 999,
  Regional: 200,
  National: 80,
  Legendary: 20,
};

/** Personality-based skill gap thresholds for matching */
const PERSONALITY_GAP_THRESHOLDS: Record<PromoterPersonality, number> = {
  Greedy: 0.35, // Prefer bigger mismatches (crowd-pleasing blowouts)
  Honorable: 0.1, // Tight skill parity (<10% vs default 25%)
  Sadistic: 0.25, // Default
  Flashy: 0.25, // Default
  Corporate: 0.2, // Stable, predictable matches
};

/** Check if warrior is a "high-kill" type (for Sadistic promoter) */
function isHighKillWarrior(w: Warrior): boolean {
  return w.career.kills > 3 || w.style === FightingStyle.BashingAttack;
}

/** Check if warrior has injury-prone characteristics */
function hasInjuryRisk(w: Warrior): boolean {
  return (w.injuries || []).some(
    (i) => i.severity === 'Moderate' || i.severity === 'Severe' || i.severity === 'Critical'
  );
}

/** Check if warrior is "showy" (for Flashy promoter) */
function isShowyWarrior(w: Warrior): boolean {
  const showyStyles = [
    FightingStyle.LungingAttack,
    FightingStyle.AimedBlow,
    FightingStyle.ParryLunge,
  ];
  return showyStyles.includes(w.style) || w.fame > 75;
}

/** Function type for personality-based match scoring. */
type MatchScoreFn = (warriorA: Warrior, warriorB: Warrior) => number;

/**
 * Strategy map: each PromoterPersonality maps to a function that scores
 * how well a given matchup fits that promoter's preference.
 */
const PERSONALITY_MATCH_SCORE: Record<PromoterPersonality, MatchScoreFn> = {
  // Prefer skill mismatches (bigger gap = higher score for greedy)
  // Gap is handled separately; this adds a bonus for mismatches.
  Greedy: () => 10,
  // Prefer tight parity – handled by threshold; adds consistency bonus.
  Honorable: () => 15,
  // Prefer Brute + high-kill warriors; injury-prone matchups.
  Sadistic: (warriorA, warriorB) => {
    const aIsBrute =
      warriorA.style === FightingStyle.BashingAttack ||
      warriorA.style === FightingStyle.StrikingAttack;
    const bIsBrute =
      warriorB.style === FightingStyle.BashingAttack ||
      warriorB.style === FightingStyle.StrikingAttack;
    let score = 0;
    if (aIsBrute || bIsBrute) score += 20;
    if (isHighKillWarrior(warriorA) || isHighKillWarrior(warriorB)) score += 15;
    if (hasInjuryRisk(warriorA) || hasInjuryRisk(warriorB)) score += 10;
    return score;
  },
  // Prefer famous + showy styles.
  Flashy: (warriorA, warriorB) => {
    let score = 0;
    if (isShowyWarrior(warriorA)) score += 10;
    if (isShowyWarrior(warriorB)) score += 10;
    if (warriorA.fame > 75 && warriorB.fame > 75) score += 20;
    return score;
  },
  // Prefer stable tier-boundary matching (already enforced by capacity).
  Corporate: () => 5,
};

/** Calculate personality-based matching score (higher = better match) */
function calculatePersonalityMatchScore(
  warriorA: Warrior,
  warriorB: Warrior,
  promoter: Promoter
): number {
  return (PERSONALITY_MATCH_SCORE[promoter.personality] ?? (() => 0))(warriorA, warriorB);
}

/** Function type for personality-based purse modifier calculation. */
type PurseModFn = (warriorA: Warrior, warriorB: Warrior, baseHype: number) => number;

/**
 * Strategy map: each PromoterPersonality maps to a purse modifier function.
 */
const PERSONALITY_PURSE_MOD: Record<PromoterPersonality, PurseModFn> = {
  // +15% purse, -10% hype (crowd-pleasing blowouts pay more but generate less organic hype)
  Greedy: () => 1.15,
  // +10% hype (competitive matches draw more interest)
  Honorable: (_a, _b, baseHype) => (baseHype > 120 ? 1.05 : 1.0),
  // Already +25 hype for kill warriors; add +20% on injury-risk pairings
  Sadistic: (warriorA, warriorB) => (hasInjuryRisk(warriorA) || hasInjuryRisk(warriorB) ? 1.2 : 1.0),
  // Already +15 hype for fame; add +20% purse when both fame > 75
  Flashy: (warriorA, warriorB) => (warriorA.fame > 75 && warriorB.fame > 75 ? 1.2 : 1.0),
  // +5% purse, stable
  Corporate: () => 1.05,
};

/** Calculate purse modifier based on promoter personality and matchup */
function calculatePersonalityPurseModifier(
  warriorA: Warrior,
  warriorB: Warrior,
  promoter: Promoter,
  baseHype: number
): number {
  return (PERSONALITY_PURSE_MOD[promoter.personality] ?? (() => 1.0))(warriorA, warriorB, baseHype);
}/**
 * Run promoter pass.
 * @param state - State.
 * @param rng - Rng. (optional)
 * @returns The result.
 */


export function runPromoterPass(state: GameState, rng?: IRNGService): StateImpact {
  const rngService = rng || new SeededRNGService(state.week * 881 + 17);
  const rankings = state.realmRankings || {};

  // 0. Garbage Collection: Prune expired or stale bout offers
  const newOffers: typeof state.boutOffers = {};
  for (const key in state.boutOffers) {
    const offer = state.boutOffers[key as BoutOfferId];
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

  const availableWarriors = allWarriors.filter(
    (warrior) => !unavailableWarriorIds.has(warrior.id)
  );

  // 2. Iterate through Promoters
  Object.values(state.promoters || []).forEach((promoter) => {
    const capacity = promoter.capacity;
    let generated = 0;

    // Attempt to fill capacity
    const shuffledWarriors = rngService.shuffle(availableWarriors);

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
      let bestGap = 0;

      for (const candidate of shuffledWarriors) {
        if (candidate.id === warriorA.id) continue;

        const rankDataB = rankings[candidate.id];
        const rankB = rankDataB?.overallRank ?? 999;
        if (rankB > RANK_REQUIREMENTS[promoter.tier]) continue;

        const scoreB = rankDataB?.compositeScore ?? 0;
        const gap = Math.abs(scoreA - scoreB) / maxScoreA;
        if (gap > gapThreshold) continue;

        const personalityScore = calculatePersonalityMatchScore(
          warriorA,
          candidate,
          promoter
        );

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
          bestGap = gap;
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
        };
        generated++;
      }
    }
  });

  return {
    boutOffers: newOffers,
  };
}

function calculateHype(a: Warrior, b: Warrior, promoter: Promoter): number {
  let hype = 100;

  // 1. Style Clash
  const isBrute = (s: FightingStyle) =>
    s === FightingStyle.BashingAttack || s === FightingStyle.StrikingAttack;
  const isEvasive = (s: FightingStyle) =>
    s === FightingStyle.TotalParry || s === FightingStyle.WallOfSteel;

  if (isBrute(a.style) && isEvasive(b.style)) hype += 20;
  if (isBrute(b.style) && isEvasive(a.style)) hype += 20;
  if (isEvasive(a.style) && isEvasive(b.style)) hype -= 30;

/** Function type for personality-based hype bias modification. */
type HypeBiasFn = (a: Warrior, b: Warrior, hype: number) => number;

/**
 * Strategy map: each PromoterPersonality maps to a function that adjusts
 * raw hype based on the matchup characteristics it values.
 */
const PERSONALITY_HYPE_BIAS: Record<PromoterPersonality, HypeBiasFn> = {
  // -10% hype for crowd-pleasing blowouts (they pay more but generate less organic hype)
  Greedy: (_a, _b, hype) => hype * 0.9,
  // +10% hype for competitive matches
  Honorable: (a, b, hype) => (Math.abs(a.fame - b.fame) < 50 ? hype * 1.1 : hype),
  // +25 hype for kill warriors; +20% on injury-risk pairings
  Sadistic: (a, b, hype) => {
    let h = hype;
    if (a.career.kills > 2 || b.career.kills > 2) h += 25;
    if (hasInjuryRisk(a) || hasInjuryRisk(b)) h *= 1.2;
    return h;
  },
  // +15 hype for fame; +10% when both have showy styles
  Flashy: (a, b, hype) => {
    let h = hype;
    if (a.fame > 100 || b.fame > 100) h += 15;
    if (isShowyWarrior(a) && isShowyWarrior(b)) h *= 1.1;
    return h;
  },
  // Stable, moderate hype — no change
  Corporate: (_a, _b, hype) => hype,
};

  // 2. Personality Bias - Extended for all personalities
  hype = (PERSONALITY_HYPE_BIAS[promoter.personality] ?? ((_a, _b, h) => h))(a, b, hype);

  // 3. "Zero has to Go"
  if (a.career.losses === 0 && b.career.losses === 0 && a.career.wins > 3 && b.career.wins > 3) {
    hype *= 1.5;
  }

  return Math.floor(hype);
}
