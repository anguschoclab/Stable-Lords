import type { WeatherType } from '@/types/shared.types';

/**
 * WeatherEffect — mechanical modifiers that a weather condition applies to a bout.
 * To add a new weather type: add it to WeatherType in shared.types.ts, then add an
 * entry here. No other files need changing.
 */
export interface WeatherEffect {
  staminaMult: number; // multiplier for enduranceCost (1.0 = baseline)
  initiativeMod: number; // flat bonus/penalty on initiative rolls
  riposteMod: number; // flat bonus/penalty on riposte defense rolls
  damageMult: number; // multiplier on hit damage
  description: string; // shown in UI tooltips
}

const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  'Cosmic Anomaly': {
    staminaMult: 0.9,
    initiativeMod: +5,
    riposteMod: -2,
    damageMult: 1.25,
    description:
      'The fabric of space tears open. Cosmic energies empower fighters but make them erratic.',
  },
  'Abyssal Tempest': {
    staminaMult: 1.6,
    initiativeMod: -2,
    riposteMod: -2,
    damageMult: 1.1,
    description:
      'A violent tear into the abyss that heavily drains stamina and unnerves the combatants.',
  },

  'Prismatic Rain': {
    staminaMult: 1.15,
    initiativeMod: 1,
    riposteMod: 1,
    damageMult: 1.05,
    description: 'Iridescent rain falls, strangely energizing the fighters.',
  },
  'Eldritch Eclipse': {
    staminaMult: 0.95,
    initiativeMod: 2,
    riposteMod: 2,
    damageMult: 1.2,
    description: 'An otherworldly eclipse that drives fighters to the brink of madness.',
  },
  'Moonlight Duel': {
    staminaMult: 1.1,
    initiativeMod: +1,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'A secret midnight challenge. 10% more stamina drain in combat.',
  },

  Zephyr: {
    staminaMult: 0.85,
    initiativeMod: 2,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'A gentle, otherworldly breeze that refreshes fighters.',
  },
  'Wild Magic': {
    staminaMult: 1.0,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.1,
    description: 'Unpredictable magical surges empower strikes.',
  },
  Clear: {
    staminaMult: 1.0,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Ideal conditions. No advantage given.',
  },
  'Crimson Snow': {
    staminaMult: 1.4,
    initiativeMod: -3,
    riposteMod: +2,
    damageMult: 1.15,
    description: 'Red snow numbs the limbs and hides the true amount of blood spilled.',
  },
  Rainy: {
    staminaMult: 1.1,
    initiativeMod: -3,
    riposteMod: +5,
    damageMult: 0.9,
    description: 'Slick sand — footwork suffers, counters come easier.',
  },
  Sweltering: {
    staminaMult: 1.3,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Oppressive heat drains stamina rapidly.',
  },
  Breezy: {
    staminaMult: 0.9,
    initiativeMod: +2,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Cool air aids recovery and sharpens reflexes.',
  },
  Overcast: {
    staminaMult: 1.0,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Flat light, neutral conditions.',
  },
  'Blazing Sun': {
    staminaMult: 1.4,
    initiativeMod: -2,
    riposteMod: -3,
    damageMult: 1.1,
    description: 'Brutal sun — heavy fighters suffer, attacks hit harder.',
  },
  Gale: {
    staminaMult: 1.2,
    initiativeMod: -5,
    riposteMod: +3,
    damageMult: 0.85,
    description: 'Gale-force winds disrupt attacks and reward counters.',
  },
  'Eclipse of Chaos': {
    staminaMult: 1.4,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.25,
    description: 'An unearthly eclipse that saps the breath but fuels destructive strikes.',
  },
  'Blood Moon': {
    staminaMult: 0.9,
    initiativeMod: +3,
    riposteMod: 0,
    damageMult: 1.2,
    description: 'Crimson moon — crowd frenzy drives fighters harder.',
  },
  'Weeping Skies': {
    staminaMult: 1.2,
    initiativeMod: +2,
    riposteMod: 0,
    damageMult: 0.95,
    description: 'A sorrowful localized rain saps energy but clears the mind.',
  },
  Eclipse: {
    staminaMult: 0.8,
    initiativeMod: +5,
    riposteMod: +5,
    damageMult: 1.3,
    description: 'Eerie darkness heightens all combat instincts.',
  },
  Sandstorm: {
    staminaMult: 1.2,
    initiativeMod: -4,
    riposteMod: 0,
    damageMult: 0.9,
    description: 'Choking dust drains stamina and blinds fighters.',
  },
  Tornado: {
    staminaMult: 1.4,
    initiativeMod: -6,
    riposteMod: -2,
    damageMult: 0.8,
    description:
      'Violent swirling winds threaten to lift fighters off their feet, destroying coordination.',
  },
  Blizzard: {
    staminaMult: 1.5,
    initiativeMod: -4,
    riposteMod: 0,
    damageMult: 0.8,
    description: 'Freezing winds drain stamina rapidly and numb the limbs.',
  },
  'Dense Fog': {
    staminaMult: 1.0,
    initiativeMod: -8,
    riposteMod: +12,
    damageMult: 1.1,
    description: 'Zero visibility — ambush tactics and counters reign supreme.',
  },
  Mist: {
    staminaMult: 1.0,
    initiativeMod: -2,
    riposteMod: +2,
    damageMult: 1.0,
    description: 'A light mist obscures the arena, making initial strikes trickier.',
  },
  'Glittering Frost': {
    staminaMult: 1.1,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.1,
    description: 'A beautiful, sharp glittering frost covers the arena. The air bites the lungs.',
  },
  Thunderstorm: {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.25,
    description: 'The roar of thunder and flash of lightning drives up the stakes.',
  },
  Ashfall: {
    staminaMult: 1.4,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 0.9,
    description: 'Falling ash chokes the air and exhausts the lungs.',
  },
  'Acid Rain': {
    staminaMult: 1.3,
    initiativeMod: 0,
    riposteMod: -6,
    damageMult: 1.2,
    description: 'Burning rain erodes armor and creates a desperate struggle.',
  },
  'Mana Surge': {
    staminaMult: 0.7,
    initiativeMod: +10,
    riposteMod: +10,
    damageMult: 1.5,
    description: 'Raw magical energy empowers every strike and movement.',
  },
  'Astral Dust': {
    staminaMult: 1.2,
    initiativeMod: +3,
    riposteMod: 0,
    damageMult: 0.9,
    description: 'Shimmering star dust makes movements erratic and draining.',
  },
  'Scorching Wind': {
    staminaMult: 1.3,
    initiativeMod: +1,
    riposteMod: -1,
    damageMult: 1.0,
    description: 'Hot winds sap stamina and dry the throat, pushing fighters to act rashly.',
  },
  'Spooky Night': {
    staminaMult: 1.1,
    initiativeMod: -2,
    riposteMod: -2,
    damageMult: 0.9,
    description: 'An unnatural chill and eerie shadows make fighters nervous and jumpy.',
  },
  'Meteor Shower': {
    staminaMult: 1.2,
    initiativeMod: -3,
    riposteMod: -3,
    damageMult: 1.15,
    description: 'Falling stars distract fighters and add a chaotic unpredictability to combat.',
  },
  'Abyssal Gloom': {
    staminaMult: 0.9,
    initiativeMod: -5,
    riposteMod: +5,
    damageMult: 1.15,
    description:
      'Impenetrable, supernatural darkness swallows the arena. Attacks are devastating, but finding the target is grueling.',
  },
  'Cursed Miasma': {
    staminaMult: 1.3,
    initiativeMod: -4,
    riposteMod: -2,
    damageMult: 1.1,
    description:
      'A vile, clinging mist saps energy and clouds the mind, leaving fighters desperate.',
  },
  Hailstorm: {
    staminaMult: 1.2,
    initiativeMod: -4,
    riposteMod: -2,
    damageMult: 0.95,
    description: 'Pummeling hail batters the fighters, hurting momentum and stamina.',
  },
  'Solar Flare': {
    staminaMult: 1.5,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.25,
    description:
      'A blinding flash of light bakes the arena, draining stamina aggressively while giving eager attackers a burst of destructive energy.',
  },
  'Arcane Storm': {
    staminaMult: 0.8,
    initiativeMod: +8,
    riposteMod: +5,
    damageMult: 1.4,
    description:
      'Raw magical energy warps reality, supercharging strikes and accelerating reflexes wildly.',
  },
  'Blood Rain': {
    staminaMult: 1.1,
    initiativeMod: -2,
    riposteMod: +2,
    damageMult: 1.2,
    description: 'Red rain slickens the sand. Violence feels inevitable.',
  },
  'Locust Swarm': {
    staminaMult: 1.2,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 0.9,
    description:
      'A blinding swarm of locusts descends upon the arena, gnawing at everything in sight.',
  },
  'Aurora Borealis': {
    staminaMult: 0.85,
    initiativeMod: 2,
    riposteMod: 1,
    damageMult: 0.95,
    description: 'The sky dances with spectral light. Fighters feel a strange, invigorating calm.',
  },
  'Chaotic Winds': {
    staminaMult: 1.3,
    initiativeMod: -4,
    riposteMod: +3,
    damageMult: 0.85,
    description: 'Erratic winds buffet the arena, disrupting movement and throwing off attacks.',
  },
  'Aether Storm': {
    staminaMult: 0.8,
    initiativeMod: +8,
    riposteMod: +3,
    damageMult: 1.3,
    description: 'Raw aetherical winds warp reality, quickening reflexes and amplifying blows.',
  },
  Mirage: {
    staminaMult: 1.1,
    initiativeMod: -5,
    riposteMod: -2,
    damageMult: 0.9,
    description:
      'Shimmering heat distortions create optical illusions. Fighters struggle to judge distance.',
  },
  Rainbow: {
    staminaMult: 0.9,
    initiativeMod: +1,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'A beautiful rainbow spans the sky. Spirits are high.',
  },
  'Ember Rain': {
    staminaMult: 1.2,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Glowing embers rain down from the sky, searing the sand and the fighters alike.',
  },
  'Wildfire Smoke': {
    staminaMult: 1.35,
    initiativeMod: -4,
    riposteMod: +2,
    damageMult: 0.9,
    description:
      'Thick smoke chokes the lungs and stings the eyes, turning fights into desperate brawls.',
  },
  'Gravity Anomaly': {
    staminaMult: 0.9,
    initiativeMod: -3,
    riposteMod: +5,
    damageMult: 1.2,
    description:
      'Fluctuating gravity makes movements unpredictable, rewarding opportunistic counters and heavy strikes.',
  },
  'Blood Fog': {
    staminaMult: 1.1,
    initiativeMod: -6,
    riposteMod: +6,
    damageMult: 1.25,
    description: 'A crimson fog obscures vision and incites a frantic, bloody panic.',
  },
  'Shimmering Heat': {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'A rippling heatwave blurs vision and exhausts fighters.',
  },
  'Crystal Rain': {
    staminaMult: 1.1,
    initiativeMod: -3,
    riposteMod: 0,
    damageMult: 1.2,
    description: 'Sharp, shimmering crystals fall from the sky, cutting through armor.',
  },
  'Winds of Chaos': {
    staminaMult: 0.8,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.15,
    description: 'Unpredictable magical gales that make initiative erratic but conserve stamina.',
  },
  'Rain of Frogs': {
    staminaMult: 1.1,
    initiativeMod: -4,
    riposteMod: -2,
    damageMult: 0.9,
    description:
      'A bizarre rain of frogs covers the arena, causing widespread confusion and making footing treacherous.',
  },
  'Chaos Storm': {
    staminaMult: 0.8,
    initiativeMod: -5,
    riposteMod: 10,
    damageMult: 1.5,
    description:
      'A swirling vortex of raw chaos tears across the arena, draining stamina, scrambling timing, and amplifying every blow with unpredictable violence.',
  },
  'Whispering Winds': {
    staminaMult: 1.0,
    initiativeMod: -1,
    riposteMod: 2,
    damageMult: 0.95,
    description:
      'Strange voices carried by the wind distract fighters, slightly lowering initiative but heightening paranoia and riposte chances.',
  },
  'Diamond Rain': {
    staminaMult: 1.2,
    initiativeMod: -2,
    riposteMod: 0,
    damageMult: 1.15,
    description: 'A bizarre rain of diamonds cuts flesh and armor alike.',
  },
  'Temporal Rift': {
    staminaMult: 2.0,
    initiativeMod: 10,
    riposteMod: 5,
    damageMult: 1.0,
    description: 'Time fractures, heavily accelerating combat at the cost of immense stamina.',
  },
  'Stardust Gale': {
    staminaMult: 1.15,
    initiativeMod: 2,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'A shimmering gale of stardust accelerates initiative but drains stamina faster.',
  },
  'Chaos Squall': {
    staminaMult: 0.85,
    initiativeMod: 3,
    riposteMod: -2,
    damageMult: 1.1,
    description:
      'Unpredictable bursts of raw energy whip through the arena, empowering strikes but punishing mistakes.',
  },
  'Mana Storm': {
    staminaMult: 1.5,
    initiativeMod: 4,
    riposteMod: 1,
    damageMult: 1.1,
    description:
      'Violent purple energy crackles in the air, giving extreme energy but draining stamina massively.',
  },
  'Shattered Skies': {
    staminaMult: 1.1,
    initiativeMod: 2,
    riposteMod: -2,
    damageMult: 1.15,
    description: 'The sky cracks like glass, unleashing raw aether that empowers blows but tires fighters quickly.',
  },
};

/**
 * Resolves the final mechanical weather condition based on arena type.
 * Indoor arenas negate all weather effects (return 'Clear').
 */
export function resolveEffectiveWeather(weather: WeatherType, arenaTags: string[]): WeatherType {
  const isIndoor = arenaTags.includes('indoor');
  return isIndoor ? 'Clear' : weather;
}

/**
 * Returns the mechanical weather effect modifiers for a given weather type.
 * Falls back to Clear (neutral) for unknown weather.
 */
export function getWeatherEffect(weather: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS['Clear'];
}

// Re-export opening lines for backward compatibility
export { weatherOpeningLine } from './weatherOpeningLines';
