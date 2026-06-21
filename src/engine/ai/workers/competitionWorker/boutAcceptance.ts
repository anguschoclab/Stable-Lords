import type { Warrior, RivalStableData, WeatherType, BoutOffer } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

export function verifyBoutAcceptance(
  rival: RivalStableData,
  warrior: Warrior,
  opponent: Warrior,
  weather: WeatherType = 'Clear'
): { accepted: boolean; reason?: string } {
  const intent = rival.strategy?.intent ?? 'CONSOLIDATION';

  // Weather Skepticism
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) {
    return { accepted: false, reason: 'Precision penalty in rain.' };
  }

  if (weather === 'Sweltering' && warrior.attributes.CN < 15) {
    return { accepted: false, reason: 'Heatstroke risk too high.' };
  }

  if (weather === 'Acid Rain') {
    return { accepted: false, reason: 'Acid rain causes permanent scarring and gear rot.' };
  }

  if (weather === 'Blizzard' && (isLunger || warrior.attributes.CN < 12)) {
    return { accepted: false, reason: 'Too cold for precise footwork/low stamina.' };
  }

  if (weather === 'Dense Fog' && isLunger) {
    return { accepted: false, reason: 'Zero visibility prevents lunging strategy.' };
  }

  if (weather === 'Sandstorm' && (isLunger || warrior.style === FightingStyle.AimedBlow)) {
    return { accepted: false, reason: 'Sandstorm blinds precision targeting.' };
  }

  if (weather === 'Gale' && (warrior.style === FightingStyle.StrikingAttack || isLunger)) {
    return { accepted: false, reason: 'Gale-force winds disrupt attack accuracy.' };
  }

  if (weather === 'Tornado') {
    return { accepted: false, reason: 'Tornado conditions make all combat unsafe.' };
  }

  if (weather === 'Hailstorm' && warrior.attributes.CN < 12) {
    return {
      accepted: false,
      reason: 'Hailstorm drains stamina too fast for low-conditioning warriors.',
    };
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

export function evaluateBoutOffer(
  offer: BoutOffer,
  rival: RivalStableData,
  warrior: Warrior,
  currentWeek: number,
  weather: WeatherType = 'Clear'
): 'Accepted' | 'Declined' {
  // 0. Desperation Gate: if treasury is critically low, accept ANYTHING for the purse
  if (rival.treasury < 500) {
    return 'Accepted';
  }

  // 0.5 Weather Skepticism (Gap 5)
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) {
    return 'Declined';
  }
  if (weather === 'Sweltering' && warrior.attributes.CN < 12) {
    return 'Declined';
  }
  if (weather === 'Dense Fog' && isLunger) {
    return 'Declined';
  }
  if (weather === 'Blizzard' && (isLunger || warrior.attributes.CN < 12)) {
    return 'Declined';
  }
  if (weather === 'Acid Rain') {
    return 'Declined';
  }

  // Tournament Hunger
  const weeksUntilTournament = 13 - (currentWeek % 13);
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

  // Injury Gate
  const hasBlockingInjury = (warrior.injuries || []).some((injury) =>
    (BLOCKING_INJURY_SEVERITIES as readonly string[]).includes(injury.severity as BlockingSeverity)
  );
  if (hasBlockingInjury) {
    return 'Declined';
  }

  // Personality Logic
  const personality = rival.owner.personality;
  const hype = offer.hype;
  const purse = offer.purse;

  if (isTournamentHungry) {
    return 'Accepted';
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
