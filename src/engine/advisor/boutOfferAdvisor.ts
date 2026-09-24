/**
 * Bout Offer Advisor
 * Evaluates candidate bout offers for each warrior, scoring style matchup edge,
 * lethality hazards (career kills), promoter reputation, and weather suitability.
 */
import type { Warrior } from '@/types/warrior.types';
import type { GameState, BoutOffer } from '@/types/state.types';
import type {
  CampaignFocus,
  WarriorFightAdvice,
  WarriorTournamentAdvice,
  CombatDangerLevel,
} from './types';
import { boutOfferAbsoluteWeek, deriveAbsoluteWeek } from '@/engine/core/absoluteWeek';
import { findWarriorById } from '@/engine/core/warriorLookup';
import { getMatchupBonus } from '@/constants/combat/combat';
import { acceptanceWeatherBlock } from '@/engine/ai/weatherSuitability';

const BLOCKING_SEVERITIES = new Set(['Moderate', 'Severe', 'Critical', 'Permanent']);

interface ScoredOffer {
  offer: BoutOffer;
  opponent: Warrior | null;
  styleEdge: number;
  score: number;
  dangerLevel: CombatDangerLevel;
  warnings: string[];
  reasons: string[];
}

/**
 * Evaluate all candidate bout offers and produce actionable fight directives for a warrior.
 */
export function evaluateBoutOffers(
  warrior: Warrior,
  state: GameState,
  campaignFocus: CampaignFocus,
  tourneyAdvice?: WarriorTournamentAdvice
): WarriorFightAdvice {
  // 1. Hard Gate: Injuries
  const blockingInjury = (warrior.injuries || []).find(
    (inj) => BLOCKING_SEVERITIES.has(inj.severity) && (inj.weeksRemaining ?? 1) > 0
  );
  if (blockingInjury) {
    return {
      action: 'BLOCKED_BY_INJURY',
      dangerLevel: 'LETHAL',
      headline: `Combat Blocked: Carrying ${blockingInjury.severity} Injury (${blockingInjury.name})`,
      reasoning: [
        `Warrior has ${blockingInjury.weeksRemaining} week(s) of recovery remaining.`,
        'Entering the arena while injured dramatically increases the lethality threshold and risk of death.',
      ],
      warnings: [`Active ${blockingInjury.severity} injury: ${blockingInjury.name}`],
    };
  }

  // 2. Hard Gate: Tournament Contender Taper Rest
  if (tourneyAdvice?.status === 'CONTENDER_REST') {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: 'SAFE',
      headline: `Rest Contender for ${tourneyAdvice.tierName ?? 'Tournament'}`,
      reasoning: [
        'Seasonal tournament bracket commences in 1–2 weeks.',
        'Resting prevents late-season fatigue and eliminates accidental training/combat injuries before the opening round.',
      ],
      warnings: [],
    };
  }

  // 3. Hard Gate: Critical Fatigue
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue >= 50) {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: 'HAZARDOUS',
      headline: `Rest Required: Critical Fatigue (${fatigue}%)`,
      reasoning: [
        'Warrior is severely fatigued.',
        'High fatigue drains combat endurance in early exchanges, opening finish/kill windows for opponents.',
      ],
      warnings: ['Warrior is exhausted and must rest or enter the Med Bay.'],
    };
  }

  // 4. Filter Candidate Offers for the Upcoming Simulation Week
  const currentAbsWeek = state.absoluteWeek ?? deriveAbsoluteWeek(state.year, state.week);
  const targetAbsWeek = currentAbsWeek + 1;
  const allOffers = Object.values(state.boutOffers || {});
  const candidateOffers = allOffers.filter(
    (o) =>
      boutOfferAbsoluteWeek(o) === targetAbsWeek &&
      o.warriorIds.includes(warrior.id) &&
      (o.status === 'Proposed' || o.status === 'Signed')
  );

  if (candidateOffers.length === 0) {
    return {
      action: 'NO_VIABLE_OFFERS',
      dangerLevel: 'SAFE',
      headline: `No Bout Offers for ${warrior.name} This Week`,
      reasoning: ['Promoters have not submitted contracts for this warrior for the upcoming week.'],
      warnings: [],
    };
  }

  // 5. Score Each Offer
  const scored: ScoredOffer[] = candidateOffers.map((offer) => {
    const opponentId = offer.warriorIds.find((id) => id !== warrior.id);
    const opponent = opponentId ? findWarriorById(state, opponentId) ?? null : null;
    const styleEdge = opponent ? getMatchupBonus(warrior.style, opponent.style) : 0;
    const weatherReason = acceptanceWeatherBlock(warrior, state.weather ?? 'Clear');
    const promoter = state.promoters?.[offer.promoterId];

    const warnings: string[] = [];
    const reasons: string[] = [];
    let dangerLevel: CombatDangerLevel = 'SAFE';

    // Lethality
    const kills = opponent?.career?.kills ?? 0;
    if (kills > 0) {
      dangerLevel = 'LETHAL';
      warnings.push(`Opponent ${opponent?.name} has ${kills} arena kill(s)! High risk of permadeath.`);
    }

    // Weather
    if (weatherReason) {
      if (dangerLevel !== 'LETHAL') dangerLevel = 'HAZARDOUS';
      warnings.push(`Weather hazard (${state.weather}): ${weatherReason}`);
    }

    // Style Matchup
    if (styleEdge >= 2) {
      reasons.push(`Hard style counter (+${styleEdge} advantage vs ${opponent?.style})`);
    } else if (styleEdge === 1) {
      reasons.push(`Favorable style matchup (+1 advantage)`);
    } else if (styleEdge === -1) {
      if (dangerLevel === 'SAFE') dangerLevel = 'MODERATE';
      warnings.push(`Unfavorable style matchup (-1 disadvantage vs ${opponent?.style})`);
    } else if (styleEdge <= -2) {
      if (dangerLevel !== 'LETHAL') dangerLevel = 'HAZARDOUS';
      warnings.push(`Severe style counter against you (${styleEdge} disadvantage vs ${opponent?.style})`);
    }

    // Promoter
    if (promoter?.personality === 'Sadistic') {
      if (dangerLevel === 'SAFE') dangerLevel = 'MODERATE';
      warnings.push('Sadistic promoter: Elevated combat lethality and underdog bias.');
    }

    // Purse Incentive
    reasons.push(`Purse: ${offer.purse} gold`);

    // Numerical Composite Score
    let score = 50;
    score += styleEdge * 20;
    score += Math.min(30, offer.purse / 10);
    if (kills > 0) score -= 60;
    if (weatherReason) score -= 35;
    if (styleEdge <= -2) score -= 40;
    if (promoter?.personality === 'Sadistic') score -= 15;

    return {
      offer,
      opponent,
      styleEdge,
      score,
      dangerLevel,
      warnings,
      reasons,
    };
  });

  // Sort by desirability
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]!;

  // If even the best match is lethal or severely hazardous with negative score, advise resting
  if (best.score < 40 && (best.dangerLevel === 'LETHAL' || best.dangerLevel === 'HAZARDOUS')) {
    return {
      action: 'REST_RECOMMENDED',
      dangerLevel: best.dangerLevel,
      headline: `Rest Advised: All Available Matches Hazardous`,
      reasoning: [
        'Available bout contracts pit warrior against lethal opponents or severe style disadvantages.',
        'Declining offers preserves warrior life and legacy.',
      ],
      warnings: best.warnings,
    };
  }

  return {
    action: 'ACCEPT_OFFER',
    recommendedOfferId: best.offer.id,
    recommendedOffer: best.offer,
    opponent: best.opponent,
    matchupEdge: best.styleEdge,
    dangerLevel: best.dangerLevel,
    headline:
      best.dangerLevel === 'SAFE'
        ? `Favorable Bout vs ${best.opponent?.name ?? 'Opponent'} (+${best.offer.purse}G)`
        : `Accept Bout vs ${best.opponent?.name ?? 'Opponent'} (+${best.offer.purse}G)`,
    reasoning: best.reasons,
    warnings: best.warnings,
  };
}
