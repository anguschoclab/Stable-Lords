/**
 * Arena Events — Environmental occurrences during combat
 * Narrative-only for v1; mechanical effects for v2
 */

import type { ArenaTag } from '@/types/shared.types';

/**
 *
 */
export interface ArenaEventConfig {
  id: string;
  name: string;
  description: string;
  requiredTags: ArenaTag[];
  triggerCondition: 'heavy_hit' | 'exchange_interval' | 'weather_combo' | 'random';
  triggerValue: number;
  narrativeText: string;
  mechanicalEffect?: {
    type: 'damage' | 'initiative_mod' | 'riposte_mod' | 'endurance_drain';
    value: number;
  };
}


export const ARENA_EVENT_CONSTANTS = {
  COLLAPSING_PILLAR_TRIGGER: 15,
  CROWD_RIOT_TRIGGER: 15,
  CROWD_RIOT_DAMAGE: 2,
  BLOOD_MOON_LIGHTING_TRIGGER: 1,
  BLOOD_MOON_LIGHTING_DAMAGE: 1.3,
  GEYSER_ERUPTION_TRIGGER: 6,
  SHADOW_TENDRIL_TRIGGER: 20,
  SHADOW_TENDRIL_DRAIN: 5,
} as const;

export const ARENA_EVENTS: Record<string, ArenaEventConfig> = {
  // ─── Ruins Events ─────────────────────────────────────────────────────────
  collapsing_pillar: {
    id: 'collapsing_pillar',
    name: 'Collapsing Pillar',
    description: 'Ancient stonework crumbles under the impact of combat',
    requiredTags: ['ruins'],
    triggerCondition: 'heavy_hit',
    triggerValue: ARENA_EVENT_CONSTANTS.COLLAPSING_PILLAR_TRIGGER, // Damage threshold
    narrativeText: 'A nearby pillar cracks and collapses in a cloud of dust!',
    // mechanicalEffect deferred to v2
  },

  falling_debris: {
    id: 'falling_debris',
    name: 'Falling Debris',
    description: 'Ceiling fragments rain down on the fighters',
    requiredTags: ['ruins', 'indoor'],
    triggerCondition: 'random',
    triggerValue: 0.03, // 3% per exchange
    narrativeText: 'Chunks of stone fall from above, forcing both fighters to dodge!',
  },


  shadow_tendrils: {
    id: 'shadow_tendrils',
    name: 'Shadow Tendrils',
    description: 'Cursed shadows lash out',
    requiredTags: ['cursed'],
    triggerCondition: 'heavy_hit',
    triggerValue: ARENA_EVENT_CONSTANTS.SHADOW_TENDRIL_TRIGGER,
    narrativeText: 'Shadow tendrils lash out from the darkness!',
    mechanicalEffect: { type: 'endurance_drain', value: ARENA_EVENT_CONSTANTS.SHADOW_TENDRIL_DRAIN }
  },

  // ─── Magical Events ─────────────────────────────────────────────────────
  crystal_resonance: {
    id: 'crystal_resonance',
    name: 'Crystal Resonance',
    description: 'The crystals hum with sympathetic energy',
    requiredTags: ['magical'],
    triggerCondition: 'exchange_interval',
    triggerValue: 5, // Every 5 exchanges
    narrativeText: 'The crystal walls pulse with light, amplifying every strike!',
  },

  aether_surge: {
    id: 'aether_surge',
    name: 'Aether Surge',
    description: 'Raw magical energy surges through the arena',
    requiredTags: ['magical'],
    triggerCondition: 'weather_combo',
    triggerValue: 1, // With Mana Surge weather
    narrativeText: 'Arcane energy crackles through the air, empowering attacks!',
  },

  // ─── Cursed Events ──────────────────────────────────────────────────────
  blood_moon_amplification: {
    id: 'blood_moon_amplification',
    name: 'Blood Moon Amplification',
    description: 'The cursed ground drinks in the crimson light',
    requiredTags: ['cursed'],
    triggerCondition: 'weather_combo',
    triggerValue: 1, // With Blood Moon weather
    narrativeText: 'The blood moon shines brighter here. Violence feels inevitable.',
  },

  restless_spirits: {
    id: 'restless_spirits',
    name: 'Restless Spirits',
    description: 'The dead beneath the arena stir',
    requiredTags: ['cursed'],
    triggerCondition: 'random',
    triggerValue: 0.05,
    narrativeText: 'Ghostly hands reach from the ground, grasping at the living!',
  },

  // ─── Living Events ────────────────────────────────────────────────────
  thorn_barbs: {
    id: 'thorn_barbs',
    name: 'Thorn Barbs',
    description: 'The flora lashes out at retreating fighters',
    requiredTags: ['living'],
    triggerCondition: 'heavy_hit',
    triggerValue: 10,
    narrativeText: 'Thorny vines whip at the fighters as they move!',
  },

  shifting_roots: {
    id: 'shifting_roots',
    name: 'Shifting Roots',
    description: 'The ground itself seems to move',
    requiredTags: ['living', 'uneven'],
    triggerCondition: 'exchange_interval',
    triggerValue: 3,
    narrativeText: 'Roots writhe beneath the sand, tangling footwork!',
  },

  // ─── Uneven Events ──────────────────────────────────────────────────────
  unstable_footing: {
    id: 'unstable_footing',
    name: 'Unstable Footing',
    description: 'Broken flagstones shift under pressure',
    requiredTags: ['uneven'],
    triggerCondition: 'random',
    triggerValue: 0.05,
    narrativeText: 'The uneven ground shifts, throwing off balance!',
  },

  // ─── Water Events ───────────────────────────────────────────────────────

  // ─── Premium Events ────────────────────────────────────────────────────
  crowd_riot: {
    id: 'crowd_riot',
    name: 'Crowd Riot',
    description: 'The wealthy patrons demand blood and throw debris',
    requiredTags: ['premium'],
    triggerCondition: 'heavy_hit',
    triggerValue: ARENA_EVENT_CONSTANTS.CROWD_RIOT_TRIGGER,
    narrativeText: 'The crowd riots in a frenzy, throwing debris into the arena!',
    mechanicalEffect: { type: 'damage', value: ARENA_EVENT_CONSTANTS.CROWD_RIOT_DAMAGE }
  },

  // ─── Blood Moon Lighting ─────────────────────────────────────────────
  blood_moon_lighting: {
    id: 'blood_moon_lighting',
    name: 'Blood Moon Lighting',
    description: 'The cursed ground glows ominously under the blood moon',
    requiredTags: ['cursed'],
    triggerCondition: 'weather_combo',
    triggerValue: ARENA_EVENT_CONSTANTS.BLOOD_MOON_LIGHTING_TRIGGER, // With Blood Moon
    narrativeText: 'The blood moon illuminates the cursed ground, driving fighters mad!',
    mechanicalEffect: { type: 'damage', value: ARENA_EVENT_CONSTANTS.BLOOD_MOON_LIGHTING_DAMAGE }
  },


  geyser_eruption: {
    id: 'geyser_eruption',
    name: 'Geyser Eruption',
    description: 'Scalding water erupts from the ground',
    requiredTags: ['water', 'uneven'],
    triggerCondition: 'exchange_interval',
    triggerValue: ARENA_EVENT_CONSTANTS.GEYSER_ERUPTION_TRIGGER,
    narrativeText: 'A hidden geyser erupts, blasting scalding water into the air!',
  },

  deepening_muck: {
    id: 'deepening_muck',
    name: 'Deepening Muck',
    description: 'Waterlogged ground becomes more treacherous',
    requiredTags: ['water'],
    triggerCondition: 'exchange_interval',
    triggerValue: 4,
    narrativeText: 'The waterlogged ground sucks at boots, slowing movement!',
  },
};

// ─── Helper Functions ──────────────────────────────────────────────────────

/**
 *
 */
export function getEventsForArena(tags: ArenaTag[]): ArenaEventConfig[] {
  return Object.values(ARENA_EVENTS).filter((event) =>
    event.requiredTags.every((tag) => tags.includes(tag))
  );
}

/**
 *
 */
export function shouldTriggerEvent(
  event: ArenaEventConfig,
  exchange: number,
  damage: number,
  weather: string,
  rng: () => number
): boolean {
  switch (event.triggerCondition) {
    case 'heavy_hit':
      return damage >= event.triggerValue;

    case 'exchange_interval':
      return exchange > 0 && exchange % event.triggerValue === 0;

    case 'weather_combo':
      return weather === 'Mana Surge' || weather === 'Blood Moon';

    case 'random':
      return rng() < event.triggerValue;

    default:
      return false;
  }
}
