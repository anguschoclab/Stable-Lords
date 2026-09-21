import type { Warrior, RivalStableData, WeatherType, BoutOffer } from '@/types/state.types';
import { displayWeek } from '@/engine/core/absoluteWeek';
import {
  acceptanceWeatherBlock,
  offerWeatherDecline,
} from '@/engine/ai/weatherSuitability';
import { COUNTERED_PURSE_CONDITION } from '@/engine/bout/mutations/contractMutations';
import { buildFightForecast } from '@/engine/narrative/fightForecast';

/**
 *
 */
export function verifyBoutAcceptance(
  rival: RivalStableData,
  warrior: Warrior,
  opponent: Warrior,
  weather: WeatherType = 'Clear'
): { accepted: boolean; reason?: string } {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';

  // Weather Skepticism — consolidated gate (G16)
  const weatherReason = acceptanceWeatherBlock(warrior, weather);
  if (weatherReason !== null) {
    return { accepted: false, reason: weatherReason };
  }

  // Skeptical Check: RECOVERY agents refuse fights with "Killers"
  if (intent === 'RECOVERY') {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      return { accepted: false, reason: 'Too risky for recovery phase.' };
    }
  }

  // Skeptical Check: AGGRESSIVE agents accept most things (unless weather is lethal)
  if (rival.owner.personality === 'Aggressive') {
    if (weather === 'Sweltering' && warrior.attributes.CN < 8) {
      return {
        accepted: false,
        reason: 'Aggressive but not suicidal; heat is too dangerous for this unit.',
      };
    }
    return { accepted: true };
  }

  // Default: Accept unless it's a massive fame gap
  if ((opponent.fame || 0) > (warrior.fame || 0) + 300) {
    return { accepted: false, reason: 'Opponent outclasses us significantly.' };
  }

  return { accepted: true };
}

/** Injury severity types that block bout acceptance. */
const BLOCKING_INJURY_SEVERITIES = ['Moderate', 'Severe', 'Critical', 'Permanent'] as const;
type BlockingSeverity = (typeof BLOCKING_INJURY_SEVERITIES)[number];

/** The rival's verdict on a bout offer — 'Countered' is a one-shot purse renegotiation. */
export type BoutEvaluation = 'Accepted' | 'Declined' | 'Countered';

/**
 * Evaluate a bout offer for a rival-owned warrior.
 * Hard safety refusals (blocking injuries, weather, RECOVERY risk) run BEFORE
 * the desperation gate — an empty treasury never overrides them (G14).
 * Marginal purses may be 'Countered' once per offer.
 */
export function evaluateBoutOffer(
  offer: BoutOffer,
  rival: RivalStableData,
  warrior: Warrior,
  currentWeek: number,
  weather: WeatherType = 'Clear',
  opponent?: Warrior
): BoutEvaluation {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';

  // ── Hard gates (cannot be bought off by desperation) ──

  // Injury Gate — blocking injuries decline at any treasury
  const hasBlockingInjury = (warrior.injuries || []).some((injury) =>
    (BLOCKING_INJURY_SEVERITIES as readonly string[]).includes(injury.severity as BlockingSeverity)
  );
  if (hasBlockingInjury) {
    return 'Declined';
  }

  // Weather Skepticism — consolidated gate (G16)
  if (offerWeatherDecline(warrior, weather)) {
    return 'Declined';
  }

  // RECOVERY risk refusal — killers and severe mismatches are never accepted,
  // even when the treasury is empty.
  if (intent === 'RECOVERY' && opponent) {
    if (opponent.career.kills > 0 || (opponent.fame || 0) > (warrior.fame || 0) + 100) {
      return 'Declined';
    }
  }

  // ── Desperation Gate: critically low treasury accepts anything survivable ──
  if (rival.treasury < 500) {
    return 'Accepted';
  }

  // Tournament Hunger — use display week since tournaments are seasonal (every 13 display weeks)
  const weeksUntilTournament = 13 - (displayWeek(currentWeek) % 13);
  const isTournamentHungry = weeksUntilTournament <= 4;

  // Inactivity Pressure
  const lastBoutWeek = warrior.lastBoutWeek;
  const weeksSinceBout = lastBoutWeek != null ? currentWeek - lastBoutWeek : 10;
  const isDesperateForBout = weeksSinceBout > 4 || isTournamentHungry;

  // Health Guard
  const hpThreshold = isDesperateForBout ? 50 : 70;
  const currentHP = warrior.derivedStats?.hp ?? 100;
  if (currentHP < hpThreshold && rival.owner.personality !== 'Aggressive') {
    return 'Declined';
  }

  // Fatigue Gate
  const fatigueThreshold = isDesperateForBout ? 90 : 70;
  const fatigue = warrior.fatigue ?? 0;
  if (fatigue > fatigueThreshold && rival.owner.personality !== 'Aggressive') {
    return 'Declined';
  }

  // Personality Logic
  const personality = rival.owner.personality;
  const hype = offer.hype;
  const purse = offer.purse;

  if (isTournamentHungry) {
    return 'Accepted';
  }

  // Matchup Skepticism — calculating stables decline a strongly unfavorable
  // style matchup when they can afford to (same forecast the player sees).
  if (opponent && (personality === 'Methodical' || personality === 'Pragmatic')) {
    const edge = buildFightForecast(warrior, opponent).styleMatchup.edge;
    if (edge <= -2) {
      return 'Declined';
    }
  }

  // Counter logic: famous warriors hold out for a purse worthy of their name.
  // The fame floor precedes the personality accepts — a Pragmatic does not
  // take 300g for a name worth 2000 just because it clears the generic bar.
  // One round only — an offer already tagged COUNTERED_PURSE is final.
  const alreadyCountered = offer.conditions?.includes(COUNTERED_PURSE_CONDITION) ?? false;
  if (!alreadyCountered && personality !== 'Aggressive') {
    const purseFloor = (warrior.fame ?? 0) - 50;
    if (purseFloor > 0 && offer.purse < purseFloor) {
      return 'Countered';
    }
  }

  if (personality === 'Aggressive' && (hype > 110 || purse > 300)) return 'Accepted';
  if (personality === 'Methodical' && currentHP < 85) {
    return 'Declined';
  }
  if (personality === 'Showman' && hype > 120) return 'Accepted';
  if (personality === 'Pragmatic' && purse > 250) return 'Accepted';

  // Default
  return 'Accepted';
}
