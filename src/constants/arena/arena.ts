/**
 * Arena System Constants
 * Tag weights, style-weather interactions, and selection parameters.
 */

// ─── Arena Tag Weights for Fit Scoring ──────────────────────────────────────
export const ARENA_TAG_WEIGHTS = {
  // Tag presence multipliers for arena selection scoring
  cramped: { weight: 1.0, description: 'Tight quarters favor close weapons' },
  open: { weight: 1.0, description: 'Open ground favors reach weapons' },
  uneven: { weight: 0.9, description: 'Uneven footing penalizes lungers' },
  ruins: { weight: 1.0, description: 'Ancient structures may shift' },
  magical: { weight: 1.1, description: 'Arcane resonance aids counters' },
  living: { weight: 0.95, description: 'Reactive environment affects movement' },
  cursed: { weight: 1.05, description: 'Dark energy amplifies lethality' },
  water: { weight: 0.9, description: 'Wet conditions slow footwork' },
  elevated: { weight: 1.0, description: 'High altitude affects stamina' },
  outdoor: { weight: 1.0, description: 'Exposed to weather effects' },
  indoor: { weight: 1.0, description: 'Sheltered from weather' },
  premium: { weight: 1.2, description: 'Prestigious venue' },
} as const;

// ─── Arena Fit Scoring Constants ───────────────────────────────────────────
export const ARENA_FIT = {
  // Range fit scoring (0–1.5 max)
  RANGE_FIT_MAX: 1.5,
  RANGE_DISTANCE_PENALTY: 0.5,
  RANGE_OVERSHOOT_PENALTY: 0.5,

  // Style-surface mod multipliers
  RIPOSTE_MOD_MULTIPLIER: 0.5, // ±0.5 per riposteMod point
  INITIATIVE_MOD_MULTIPLIER: 0.25, // ±0.25 per initiativeMod point

  // Endurance/drain calculations
  HIGH_AGG_CN_FACTOR: 1.5,
  CN_BASELINE: 15,
  DRAIN_DESCRIPTION_THRESHOLD: 0.2,

  // Tag-based scoring adjustments
  CLOSE_RANGE_BONUS: 0.3, // For cramped + close weapon
  REACH_BONUS: 0.3, // For open + extended weapon
  UNEVEN_INITIATIVE_PENALTY: 0.2, // For uneven + initiative styles
} as const;

// ─── Arena Selection Constants ─────────────────────────────────────────────
export const ARENA_SELECTION = {
  FAVOR_WEIGHT_DEFAULT: 1.2,
  SCORE_SHIFT_BUFFER: 0.1,
  TOURNAMENT_DEFAULT_ARENA: 'bloodsands_arena',
  EXCLUDED_ARENA_IDS: ['bloodsands_arena'],
} as const;

// ─── Tournament Arena Filter Defaults ─────────────────────────────────────
export const TOURNAMENT_ARENA_DEFAULTS = {
  MIN_TIER: 2,
  MAX_TIER: 3,
  LARGE_BRACKET_THRESHOLD: 16, // Brackets >= this size exclude 'cramped' arenas
} as const;

// ─── Style-Weather Modifiers ───────────────────────────────────────────────
// Flat modifiers applied based on fighting style + weather combination
export const STYLE_WEATHER_MODIFIERS: Record<
  string,
  {
    initiativeMod?: number;
    riposteMod?: number;
    damageMult?: number;
    description: string;
  }
> = {
  // Rain penalizes lungers (slippery footing for lunges)
  'Rainy:LUNGING ATTACK': {
    initiativeMod: -2,
    description: 'Rain-slicked sand hinders lunging footwork',
  },

  // Dense Fog benefits riposters (close-quarters ambush)
  'Dense Fog:PARRY-RIPOSTE': {
    riposteMod: +3,
    description: 'Fog favors counter-fighters hiding their movements',
  },
  'Dense Fog:PARRY-LUNGE': {
    riposteMod: +2,
    description: 'Fog aids the cunning counter-striker',
  },

  // Sandstorm penalizes aimed blows (can't aim)
  'Sandstorm:AIMED BLOW': {
    initiativeMod: -4,
    description: 'Dust blinds precision targeting',
  },

  // Blood Moon affects aggressive styles
  'Blood Moon:BASHING ATTACK': {
    damageMult: 1.1,
    description: 'Bloodlust amplifies brutal strikes',
  },
  'Blood Moon:SLASHING ATTACK': {
    damageMult: 1.05,
    description: 'The crimson moon whets the blade',
  },

  // Blizzard affects high-mobility styles
  'Blizzard:LUNGING ATTACK': {
    initiativeMod: -3,
    description: 'Freezing winds slow explosive movement',
  },
  'Blizzard:STRIKING ATTACK': {
    initiativeMod: -2,
    description: 'Snow drifts hamper rhythmic striking',
  },

  // Mana Surge benefits magical fighting styles
  'Mana Surge:AIMED BLOW': {
    damageMult: 1.15,
    description: 'Arcane focus sharpens precision strikes',
  },

  // ─── Arena-Tag + Weather Combinations ────────────────────────────────────
  // These stack with base weather effects

  'cursed:Blood Moon': {
    damageMult: 1.1, // +10% in cursed arenas (stacks with base 1.2 = 1.32 total)
    description: 'Cursed ground amplifies bloodlust',
  },

  'water:Rainy': {
    initiativeMod: -1, // Extra -1 in water arenas during rain
    description: 'Standing water deepens with fresh rain',
  },

  'uneven:Blizzard': {
    initiativeMod: -2, // Extra slippery
    description: 'Ice forms on broken ground',
  },

  'magical:Mana Surge': {
    riposteMod: +3, // Crystal acoustics
    description: 'Magical resonance aids riposte timing',
  },

  'living:Gale': {
    initiativeMod: -2, // Branches whip in wind
    description: 'The living forest writhes in the gale',
  },
};

// ─── Arena Event Constants ─────────────────────────────────────────────────
export const ARENA_EVENT_CONSTANTS = {
  // Collapsing pillars (ruins tag)
  COLLAPSING_PILLAR_TRIGGER_CHANCE: 0.05, // 5% per heavy hit
  COLLAPSING_PILLAR_DAMAGE_MIN: 2,
  COLLAPSING_PILLAR_DAMAGE_MAX: 5,

  // Blood moon lighting (cursed tag + Blood Moon weather)
  BLOOD_MOON_CURSED_DAMAGE_MULT: 1.3, // +30% damage (replaces base 1.2)

  // Crowd riots (premium tag + specific crowd moods)
  CROWD_RIOT_MOMENTUM_SHIFT: 1,

  // Crystal resonance (magical tag)
  CRYSTAL_RESONANCE_RIPOSTE_BONUS: 2,
  CRYSTAL_RESONANCE_EXCHANGE_INTERVAL: 5, // Every 5 exchanges
} as const;

// ─── Helper Functions ──────────────────────────────────────────────────────
import type { FightingStyle, WeatherType } from '@/types/shared.types';

export function getStyleWeatherModifier(
  style: FightingStyle,
  weather: WeatherType,
  arenaTags: string[]
): { initiativeMod: number; riposteMod: number; damageMult: number; descriptions: string[] } {
  let initiativeMod = 0;
  let riposteMod = 0;
  let damageMult = 1.0;
  const descriptions: string[] = [];

  // Check style + weather combination
  const styleKey = `${weather}:${style}`;
  const styleMod = STYLE_WEATHER_MODIFIERS[styleKey];
  if (styleMod) {
    initiativeMod += styleMod.initiativeMod ?? 0;
    riposteMod += styleMod.riposteMod ?? 0;
    damageMult *= styleMod.damageMult ?? 1.0;
    descriptions.push(styleMod.description);
  }

  // Check tag + weather combinations
  for (const tag of arenaTags) {
    const tagKey = `${tag}:${weather}`;
    const tagMod = STYLE_WEATHER_MODIFIERS[tagKey];
    if (tagMod) {
      initiativeMod += tagMod.initiativeMod ?? 0;
      riposteMod += tagMod.riposteMod ?? 0;
      damageMult *= tagMod.damageMult ?? 1.0;
      descriptions.push(tagMod.description);
    }
  }

  return { initiativeMod, riposteMod, damageMult, descriptions };
}
