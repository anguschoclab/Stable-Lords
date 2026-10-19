/**
 * Weather suitability — single source for every AI weather rule.
 *
 * `WEATHER_AI_DISPOSITION` declares one explicit disposition per WeatherType:
 * `arena` entries may carry gates (acceptance block, offer decline, committee
 * skepticism, bid modifier, hazard flag); `offseason` entries are event-only
 * and carry none. The five public helpers are thin readers over the record —
 * signatures are unchanged for all call sites.
 *
 * Completeness is guarded by
 * src/test/engine/ai/weatherDisposition.completeness.test.ts; per-cell parity
 * with the legacy call-site tables by weatherSuitability.test.ts.
 */
import type { Warrior, WeatherType } from '@/types/state.types';
import { WEATHER_TYPES } from '@/types/enumSources';
import { FightingStyle } from '@/types/shared.types';

type WeatherSubject = Pick<Warrior, 'style' | 'attributes'>;

/** One weather type's full AI disposition. */
interface WeatherDisposition {
  /** `arena` weather is rolled in-season; `offseason` is event-only. */
  bucket: 'arena' | 'offseason';
  /** Treated as strategically hazardous by the intent engine. */
  hazardous?: boolean;
  /** verifyBoutAcceptance refusal reason, or null when acceptable. */
  acceptanceBlock?: (w: WeatherSubject) => string | null;
  /** evaluateBoutOffer refusal gate. */
  offerDecline?: (w: WeatherSubject) => boolean;
  /** Tournament committee entry skepticism. */
  committeeSkip?: (w: WeatherSubject) => boolean;
  /** Bout-bid priority modifier. */
  bidModifier?: (w: WeatherSubject) => number;
}

const LUNGER = (w: WeatherSubject) => w.style === FightingStyle.LungingAttack;
const BASHING = (w: WeatherSubject) => w.style === FightingStyle.BashingAttack;
const RIPOSTE = (w: WeatherSubject) => w.style === FightingStyle.ParryRiposte;
const STRIKING = (w: WeatherSubject) => w.style === FightingStyle.StrikingAttack;
const AIMED = (w: WeatherSubject) => w.style === FightingStyle.AimedBlow;
const CN_LT = (n: number) => (w: WeatherSubject) => w.attributes.CN < n;
/** Committee skepticism treats a missing CN as 0 — legacy `(CN || 0)` semantics. */
const CN0_LT = (n: number) => (w: WeatherSubject) => (w.attributes.CN || 0) < n;

const ARENA: WeatherDisposition = { bucket: 'arena' };
const OFFSEASON: WeatherDisposition = { bucket: 'offseason' };

const WEATHER_AI_DISPOSITION: Record<WeatherType, WeatherDisposition> = {
  Clear: ARENA,
  Rainy: {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: (w) => (LUNGER(w) ? 'Precision penalty in rain.' : null),
    offerDecline: LUNGER,
    committeeSkip: LUNGER,
    bidModifier: (w) => (LUNGER(w) ? -3 : BASHING(w) ? 2 : 0),
  },
  Sweltering: {
    bucket: 'arena',
    acceptanceBlock: (w) => (CN_LT(15)(w) ? 'Heatstroke risk too high.' : null),
    offerDecline: CN_LT(12),
    committeeSkip: CN0_LT(10),
    bidModifier: (w) => (CN_LT(10)(w) ? -2 : 0),
  },
  Breezy: ARENA,
  Overcast: ARENA,
  'Blazing Sun': ARENA,
  Gale: {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: (w) =>
      STRIKING(w) || LUNGER(w) ? 'Gale-force winds disrupt attack accuracy.' : null,
    bidModifier: (w) => (RIPOSTE(w) ? 2 : -3),
  },
  'Blood Moon': {
    bucket: 'arena',
    bidModifier: (w) => (BASHING(w) || STRIKING(w) ? 3 : 0),
  },
  'Weeping Skies': OFFSEASON,
  'Eclipse of Chaos': OFFSEASON,
  Eclipse: { bucket: 'arena', bidModifier: () => 2 },
  Sandstorm: {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: (w) =>
      LUNGER(w) || AIMED(w) ? 'Sandstorm blinds precision targeting.' : null,
    bidModifier: (w) => (BASHING(w) ? 1 : -3),
  },
  Tornado: {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: () => 'Tornado conditions make all combat unsafe.',
    bidModifier: () => -5,
  },
  Blizzard: {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: (w) =>
      LUNGER(w) || CN_LT(12)(w) ? 'Too cold for precise footwork/low stamina.' : null,
    offerDecline: (w) => LUNGER(w) || CN_LT(12)(w),
    bidModifier: (w) => (BASHING(w) ? -1 : -4),
  },
  'Dense Fog': {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: (w) =>
      LUNGER(w) ? 'Zero visibility prevents lunging strategy.' : null,
    offerDecline: LUNGER,
    bidModifier: (w) => (LUNGER(w) ? -5 : RIPOSTE(w) ? 3 : 0),
  },
  Mist: ARENA,
  Thunderstorm: { bucket: 'arena', bidModifier: (w) => (BASHING(w) ? 2 : -1) },
  Ashfall: { bucket: 'arena', bidModifier: (w) => (CN_LT(14)(w) ? -3 : 0) },
  'Eldritch Eclipse': OFFSEASON,
  'Cursed Eclipse': {
    // V16 — was registered as seasonable Fall weather with zero AI rules.
    bucket: 'arena',
    acceptanceBlock: (w) =>
      CN_LT(12)(w) ? 'The eclipse saps weak constitutions.' : null,
    offerDecline: CN_LT(10),
    committeeSkip: CN0_LT(10),
    bidModifier: (w) => (RIPOSTE(w) ? 3 : CN_LT(12)(w) ? -3 : -1),
  },
  'Prismatic Rain': OFFSEASON,
  'Moonlight Duel': OFFSEASON,
  'Acid Rain': {
    bucket: 'arena',
    hazardous: true,
    acceptanceBlock: () => 'Acid rain causes permanent scarring and gear rot.',
    offerDecline: () => true,
    bidModifier: () => -6,
  },
  'Mana Surge': { bucket: 'arena', bidModifier: () => 4 },
  Rainbow: ARENA,
  'Astral Dust': ARENA,
  'Scorching Wind': { bucket: 'arena', bidModifier: (w) => (CN_LT(12)(w) ? -3 : -2) },
  'Wild Magic': ARENA,
  'Spooky Night': { bucket: 'arena', bidModifier: () => -2 },
  'Meteor Shower': { bucket: 'arena', bidModifier: () => -2 },
  'Solar Flare': ARENA,
  'Abyssal Gloom': { bucket: 'arena', bidModifier: (w) => (RIPOSTE(w) ? 3 : 1) },
  'Cursed Miasma': { bucket: 'arena', bidModifier: () => -3 },
  Hailstorm: {
    bucket: 'arena',
    acceptanceBlock: (w) =>
      CN_LT(12)(w) ? 'Hailstorm drains stamina too fast for low-conditioning warriors.' : null,
    bidModifier: (w) => (CN_LT(10)(w) ? -4 : -2),
  },
  'Arcane Storm': ARENA,
  'Blood Rain': { bucket: 'arena', bidModifier: (w) => (BASHING(w) ? 2 : 1) },
  'Aurora Borealis': ARENA,
  'Chaotic Winds': { bucket: 'arena', bidModifier: (w) => (RIPOSTE(w) ? 1 : -2) },
  'Aether Storm': ARENA,
  'Locust Swarm': ARENA,
  'Gravity Anomaly': ARENA,
  Mirage: { bucket: 'arena', bidModifier: (w) => (LUNGER(w) ? -4 : -2) },
  'Ember Rain': ARENA,
  Zephyr: ARENA,
  'Wildfire Smoke': { bucket: 'arena', bidModifier: (w) => (CN_LT(12)(w) ? -4 : -3) },
  'Blood Fog': ARENA,
  'Shimmering Heat': ARENA,
  'Crystal Rain': ARENA,
  'Rain of Frogs': ARENA,
  'Winds of Chaos': OFFSEASON,
  'Chaos Storm': ARENA,
  'Chaos Squall': ARENA,
  'Prismatic Gale': ARENA,
  'Crimson Snow': ARENA,
  'Whispering Winds': ARENA,
  'Glittering Frost': ARENA,
  'Diamond Rain': OFFSEASON,
  'Cosmic Anomaly': OFFSEASON,
  'Abyssal Tempest': ARENA,
  'Temporal Rift': ARENA,
  'Stardust Gale': ARENA,
  'Mana Storm': OFFSEASON,
  'Dreamweavers Mist': OFFSEASON,
  'Shattered Skies': OFFSEASON,
};

/** Weather the intent engine treats as strategically hazardous. */
export const HAZARDOUS_WEATHER: readonly WeatherType[] = WEATHER_TYPES.filter(
  (w) => WEATHER_AI_DISPOSITION[w].hazardous === true
);

/**
 * verifyBoutAcceptance's weather refusal gates.
 * Returns the refusal reason, or null when the bout is weather-acceptable.
 */
export function acceptanceWeatherBlock(
  warrior: WeatherSubject,
  weather: WeatherType
): string | null {
  return WEATHER_AI_DISPOSITION[weather].acceptanceBlock?.(warrior) ?? null;
}

/** evaluateBoutOffer's weather refusal gates (subset of the acceptance gate). */
export function offerWeatherDecline(warrior: WeatherSubject, weather: WeatherType): boolean {
  return WEATHER_AI_DISPOSITION[weather].offerDecline?.(warrior) ?? false;
}

/** Tournament committee entry skepticism (rank-based selection unchanged). */
export function committeeWeatherSkip(warrior: WeatherSubject, weather: WeatherType): boolean {
  return WEATHER_AI_DISPOSITION[weather].committeeSkip?.(warrior) ?? false;
}

/**
 * Bid-priority weather modifier — the data table previously inlined in
 * generateBoutBids. Consumed from this one place now.
 */
export function weatherBidModifier(warrior: WeatherSubject, weather: WeatherType): number {
  return WEATHER_AI_DISPOSITION[weather].bidModifier?.(warrior) ?? 0;
}
