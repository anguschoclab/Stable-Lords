/**
 * D.0 — Weather suitability consolidation parity.
 * Characterizes the five legacy weather gate implementations (verifyBoutAcceptance,
 * evaluateBoutOffer, committeeSelection, boutBidding modifiers, intentEngine hazard
 * list) as truth tables and sweeps every WeatherType × style × CN cell to prove the
 * consolidated helpers agree before the call sites are replaced.
 */
import { describe, it, expect } from 'vitest';
import { FightingStyle, type WeatherType } from '@/types/shared.types';
import type { Warrior } from '@/types/warrior.types';
import {
  HAZARDOUS_WEATHER,
  acceptanceWeatherBlock,
  offerWeatherDecline,
  committeeWeatherSkip,
  weatherBidModifier,
} from '@/engine/ai/weatherSuitability';
import { makeWarrior } from '@/test/_fixtures/factories';

const ALL_WEATHER: WeatherType[] = [
  'Clear',
  'Rainy',
  'Sweltering',
  'Blizzard',
  'Dense Fog',
  'Sandstorm',
  'Gale',
  'Tornado',
  'Hailstorm',
  'Thunderstorm',
  'Ashfall',
  'Acid Rain',
  'Mana Surge',
  'Blood Moon',
  'Eclipse',
  'Scorching Wind',
  'Spooky Night',
  'Meteor Shower',
  'Abyssal Gloom',
  'Cursed Miasma',
  'Chaotic Winds',
  'Blood Rain',
  'Wildfire Smoke',
  'Mirage',
  'Moonlight Duel',
  'Breezy',
  'Overcast',
];
const ALL_STYLES = Object.values(FightingStyle);
const CN_VALUES = [0, 5, 8, 10, 12, 15, 20];

// ── Legacy reference implementations (verbatim from call sites) ────────────

function legacyVerifyBlock(w: Warrior, weather: WeatherType): boolean {
  const isLunger = w.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) return true;
  if (weather === 'Sweltering' && w.attributes.CN < 15) return true;
  if (weather === 'Acid Rain') return true;
  if (weather === 'Blizzard' && (isLunger || w.attributes.CN < 12)) return true;
  if (weather === 'Dense Fog' && isLunger) return true;
  if (weather === 'Sandstorm' && (isLunger || w.style === FightingStyle.AimedBlow)) return true;
  if (weather === 'Gale' && (w.style === FightingStyle.StrikingAttack || isLunger)) return true;
  if (weather === 'Tornado') return true;
  if (weather === 'Hailstorm' && w.attributes.CN < 12) return true;
  return false;
}

function legacyOfferDecline(w: Warrior, weather: WeatherType): boolean {
  const isLunger = w.style === FightingStyle.LungingAttack;
  if (weather === 'Rainy' && isLunger) return true;
  if (weather === 'Sweltering' && w.attributes.CN < 12) return true;
  if (weather === 'Dense Fog' && isLunger) return true;
  if (weather === 'Blizzard' && (isLunger || w.attributes.CN < 12)) return true;
  if (weather === 'Acid Rain') return true;
  return false;
}

function legacyCommitteeSkip(w: Warrior, weather: WeatherType): boolean {
  if (weather === 'Rainy' && w.style === FightingStyle.LungingAttack) return true;
  if (weather === 'Sweltering' && (w.attributes.CN || 0) < 10) return true;
  return false;
}

function legacyBidModifier(warrior: Warrior, weather: WeatherType): number {
  let weatherModifier = 0;
  if (weather === 'Rainy') {
    if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -3;
    if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2;
  } else if (weather === 'Sweltering' && warrior.attributes.CN < 10) {
    weatherModifier = -2;
  } else if (weather === 'Blizzard') {
    weatherModifier = -4;
    if (warrior.style === FightingStyle.BashingAttack) weatherModifier = -1;
  } else if (weather === 'Dense Fog') {
    if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -5;
    if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +3;
  } else if (weather === 'Thunderstorm') {
    weatherModifier = -1;
    if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2;
  } else if (weather === 'Ashfall') {
    if (warrior.attributes.CN < 14) weatherModifier = -3;
  } else if (weather === 'Acid Rain') {
    weatherModifier = -6;
  } else if (weather === 'Mana Surge') {
    weatherModifier = +4;
  } else if (weather === 'Gale') {
    weatherModifier = -3;
    if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +2;
  } else if (weather === 'Sandstorm') {
    weatherModifier = -3;
    if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +1;
  } else if (weather === 'Tornado') {
    weatherModifier = -5;
  } else if (weather === 'Blood Moon') {
    if (
      warrior.style === FightingStyle.BashingAttack ||
      warrior.style === FightingStyle.StrikingAttack
    )
      weatherModifier = +3;
  } else if (weather === 'Hailstorm') {
    weatherModifier = -2;
    if (warrior.attributes.CN < 10) weatherModifier = -4;
  } else if (weather === 'Eclipse') {
    weatherModifier = +2;
  } else if (weather === 'Scorching Wind') {
    weatherModifier = -2;
    if (warrior.attributes.CN < 12) weatherModifier = -3;
  } else if (weather === 'Spooky Night') {
    weatherModifier = -2;
  } else if (weather === 'Meteor Shower') {
    weatherModifier = -2;
  } else if (weather === 'Abyssal Gloom') {
    weatherModifier = +1;
    if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +3;
  } else if (weather === 'Cursed Miasma') {
    weatherModifier = -3;
  } else if (weather === 'Chaotic Winds') {
    weatherModifier = -2;
    if (warrior.style === FightingStyle.ParryRiposte) weatherModifier = +1;
  } else if (weather === 'Blood Rain') {
    weatherModifier = +1;
    if (warrior.style === FightingStyle.BashingAttack) weatherModifier = +2;
  } else if (weather === 'Wildfire Smoke') {
    weatherModifier = -3;
    if (warrior.attributes.CN < 12) weatherModifier = -4;
  } else if (weather === 'Mirage') {
    weatherModifier = -2;
    if (warrior.style === FightingStyle.LungingAttack) weatherModifier = -4;
  }
  return weatherModifier;
}

const LEGACY_HAZARDOUS = [
  'Rainy',
  'Blizzard',
  'Sandstorm',
  'Gale',
  'Tornado',
  'Dense Fog',
  'Acid Rain',
];

describe('weatherSuitability consolidation (G16 parity)', () => {
  it('acceptance gate matches verifyBoutAcceptance across the full matrix', () => {
    for (const weather of ALL_WEATHER) {
      for (const style of ALL_STYLES) {
        for (const cn of CN_VALUES) {
          const w = makeWarrior({
            style,
            attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          });
          const blocked = acceptanceWeatherBlock(w, weather) !== null;
          expect(blocked, `${weather}/${style}/CN${cn}`).toBe(legacyVerifyBlock(w, weather));
        }
      }
    }
  });

  it('offer gate matches evaluateBoutOffer weather rules across the full matrix', () => {
    for (const weather of ALL_WEATHER) {
      for (const style of ALL_STYLES) {
        for (const cn of CN_VALUES) {
          const w = makeWarrior({
            style,
            attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          });
          expect(offerWeatherDecline(w, weather), `${weather}/${style}/CN${cn}`).toBe(
            legacyOfferDecline(w, weather)
          );
        }
      }
    }
  });

  it('committee gate matches tournamentSelection across the full matrix', () => {
    for (const weather of ALL_WEATHER) {
      for (const style of ALL_STYLES) {
        for (const cn of CN_VALUES) {
          const w = makeWarrior({
            style,
            attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          });
          expect(committeeWeatherSkip(w, weather), `${weather}/${style}/CN${cn}`).toBe(
            legacyCommitteeSkip(w, weather)
          );
        }
      }
    }
  });

  it('bid modifier table matches legacy scoring across the full matrix', () => {
    for (const weather of ALL_WEATHER) {
      for (const style of ALL_STYLES) {
        for (const cn of CN_VALUES) {
          const w = makeWarrior({
            style,
            attributes: { ST: 10, CN: cn, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
          });
          expect(weatherBidModifier(w, weather), `${weather}/${style}/CN${cn}`).toBe(
            legacyBidModifier(w, weather)
          );
        }
      }
    }
  });

  it('HAZARDOUS_WEATHER matches the legacy intentEngine list', () => {
    expect([...HAZARDOUS_WEATHER].sort()).toEqual([...LEGACY_HAZARDOUS].sort());
  });
});
