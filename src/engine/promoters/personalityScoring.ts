/**
 * Personality-Based Scoring
 * Promoter personality-specific scoring functions for match quality, purse modifiers, and hype bias.
 */
import { FightingStyle } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import type { Promoter, PromoterPersonality } from '@/types/state.types';
import { isHighKillWarrior, hasInjuryRisk, isShowyWarrior } from './warriorFilters';

/** Function type for personality-based match scoring. */
type MatchScoreFn = (warriorA: Warrior, warriorB: Warrior) => number;

/**
 * Strategy map: each PromoterPersonality maps to a function that scores
 * how well a given matchup fits that promoter's preference.
 */
export const PERSONALITY_MATCH_SCORE: Record<PromoterPersonality, MatchScoreFn> = {
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
export function calculatePersonalityMatchScore(
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
export const PERSONALITY_PURSE_MOD: Record<PromoterPersonality, PurseModFn> = {
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
export function calculatePersonalityPurseModifier(
  warriorA: Warrior,
  warriorB: Warrior,
  promoter: Promoter,
  baseHype: number
): number {
  return (PERSONALITY_PURSE_MOD[promoter.personality] ?? (() => 1.0))(warriorA, warriorB, baseHype);
}

/** Function type for personality-based hype bias modification. */
type HypeBiasFn = (a: Warrior, b: Warrior, hype: number) => number;

/**
 * Strategy map: each PromoterPersonality maps to a function that adjusts
 * raw hype based on the matchup characteristics it values.
 */
export const PERSONALITY_HYPE_BIAS: Record<PromoterPersonality, HypeBiasFn> = {
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
