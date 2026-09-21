/**
 * Weather suitability — single source for every AI weather rule.
 *
 * Consolidates the five duplicated implementations (G16):
 * - `acceptanceWeatherBlock` — verifyBoutAcceptance's refusal gates
 * - `offerWeatherDecline` — evaluateBoutOffer's refusal gates
 * - `committeeWeatherSkip` — tournament entry skepticism
 * - `weatherBidModifier` — bout-bid priority data table
 * - `HAZARDOUS_WEATHER` — intentEngine's strategic hazard list
 *
 * Parity-locked by src/test/engine/ai/weatherSuitability.test.ts, which
 * sweeps every WeatherType × style × CN cell against the legacy truth tables.
 */
import type { Warrior, WeatherType } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';

type WeatherSubject = Pick<Warrior, 'style' | 'attributes'>;

/** Weather the intent engine treats as strategically hazardous. */
export const HAZARDOUS_WEATHER: readonly WeatherType[] = [
  'Rainy',
  'Blizzard',
  'Sandstorm',
  'Gale',
  'Tornado',
  'Dense Fog',
  'Acid Rain',
];

/**
 * verifyBoutAcceptance's weather refusal gates.
 * Returns the refusal reason, or null when the bout is weather-acceptable.
 */
export function acceptanceWeatherBlock(
  warrior: WeatherSubject,
  weather: WeatherType
): string | null {
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) {
    return 'Precision penalty in rain.';
  }
  if (weather === 'Sweltering' && warrior.attributes.CN < 15) {
    return 'Heatstroke risk too high.';
  }
  if (weather === 'Acid Rain') {
    return 'Acid rain causes permanent scarring and gear rot.';
  }
  if (weather === 'Blizzard' && (isLunger || warrior.attributes.CN < 12)) {
    return 'Too cold for precise footwork/low stamina.';
  }
  if (weather === 'Dense Fog' && isLunger) {
    return 'Zero visibility prevents lunging strategy.';
  }
  if (weather === 'Sandstorm' && (isLunger || warrior.style === FightingStyle.AimedBlow)) {
    return 'Sandstorm blinds precision targeting.';
  }
  if (weather === 'Gale' && (warrior.style === FightingStyle.StrikingAttack || isLunger)) {
    return 'Gale-force winds disrupt attack accuracy.';
  }
  if (weather === 'Tornado') {
    return 'Tornado conditions make all combat unsafe.';
  }
  if (weather === 'Hailstorm' && warrior.attributes.CN < 12) {
    return 'Hailstorm drains stamina too fast for low-conditioning warriors.';
  }
  return null;
}

/** evaluateBoutOffer's weather refusal gates (subset of the acceptance gate). */
export function offerWeatherDecline(warrior: WeatherSubject, weather: WeatherType): boolean {
  const isLunger = warrior.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) return true;
  if (weather === 'Sweltering' && warrior.attributes.CN < 12) return true;
  if (weather === 'Dense Fog' && isLunger) return true;
  if (weather === 'Blizzard' && (isLunger || warrior.attributes.CN < 12)) return true;
  if (weather === 'Acid Rain') return true;
  return false;
}

/** Tournament committee entry skepticism (rank-based selection unchanged). */
export function committeeWeatherSkip(
  warrior: WeatherSubject,
  weather: WeatherType
): boolean {
  if (weather === 'Rainy' && warrior.style === FightingStyle.LungingAttack) return true;
  if (weather === 'Sweltering' && (warrior.attributes.CN || 0) < 10) return true;
  return false;
}

/**
 * Bid-priority weather modifier — the data table previously inlined in
 * generateBoutBids. Consumed from this one place now.
 */
export function weatherBidModifier(warrior: WeatherSubject, weather: WeatherType): number {
  if (weather === 'Rainy') {
    if (warrior.style === FightingStyle.LungingAttack) return -3;
    if (warrior.style === FightingStyle.BashingAttack) return +2;
  } else if (weather === 'Sweltering' && warrior.attributes.CN < 10) {
    return -2;
  } else if (weather === 'Blizzard') {
    if (warrior.style === FightingStyle.BashingAttack) return -1;
    return -4;
  } else if (weather === 'Dense Fog') {
    if (warrior.style === FightingStyle.LungingAttack) return -5;
    if (warrior.style === FightingStyle.ParryRiposte) return +3;
  } else if (weather === 'Thunderstorm') {
    if (warrior.style === FightingStyle.BashingAttack) return +2;
    return -1;
  } else if (weather === 'Ashfall') {
    if (warrior.attributes.CN < 14) return -3;
  } else if (weather === 'Acid Rain') {
    return -6;
  } else if (weather === 'Mana Surge') {
    return +4;
  } else if (weather === 'Gale') {
    if (warrior.style === FightingStyle.ParryRiposte) return +2;
    return -3;
  } else if (weather === 'Sandstorm') {
    if (warrior.style === FightingStyle.BashingAttack) return +1;
    return -3;
  } else if (weather === 'Tornado') {
    return -5;
  } else if (weather === 'Blood Moon') {
    if (
      warrior.style === FightingStyle.BashingAttack ||
      warrior.style === FightingStyle.StrikingAttack
    )
      return +3;
  } else if (weather === 'Hailstorm') {
    if (warrior.attributes.CN < 10) return -4;
    return -2;
  } else if (weather === 'Eclipse') {
    return +2;
  } else if (weather === 'Scorching Wind') {
    if (warrior.attributes.CN < 12) return -3;
    return -2;
  } else if (weather === 'Spooky Night') {
    return -2;
  } else if (weather === 'Meteor Shower') {
    return -2;
  } else if (weather === 'Abyssal Gloom') {
    if (warrior.style === FightingStyle.ParryRiposte) return +3;
    return +1;
  } else if (weather === 'Cursed Miasma') {
    return -3;
  } else if (weather === 'Chaotic Winds') {
    if (warrior.style === FightingStyle.ParryRiposte) return +1;
    return -2;
  } else if (weather === 'Blood Rain') {
    if (warrior.style === FightingStyle.BashingAttack) return +2;
    return +1;
  } else if (weather === 'Wildfire Smoke') {
    if (warrior.attributes.CN < 12) return -4;
    return -3;
  } else if (weather === 'Mirage') {
    if (warrior.style === FightingStyle.LungingAttack) return -4;
    return -2;
  }
  return 0;
}
