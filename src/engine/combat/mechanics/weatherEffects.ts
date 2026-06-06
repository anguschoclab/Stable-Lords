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
  Clear: {
    staminaMult: 1.0,
    initiativeMod: 0,
    riposteMod: 0,
    damageMult: 1.0,
    description: 'Ideal conditions. No advantage given.',
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
  'Blood Moon': {
    staminaMult: 0.9,
    initiativeMod: +3,
    riposteMod: 0,
    damageMult: 1.2,
    description: 'Crimson moon — crowd frenzy drives fighters harder.',
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
    description: 'A blinding flash of light bakes the arena, draining stamina aggressively while giving eager attackers a burst of destructive energy.',
  },
  'Arcane Storm': {
    staminaMult: 0.8,
    initiativeMod: +8,
    riposteMod: +5,
    damageMult: 1.4,
    description: 'Raw magical energy warps reality, supercharging strikes and accelerating reflexes wildly.',
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
    description: 'A blinding swarm of locusts descends upon the arena, gnawing at everything in sight.',
  },
  'Aether Storm': {
    staminaMult: 0.8,
    initiativeMod: +8,
    riposteMod: +3,
    damageMult: 1.3,
    description: 'Raw aetherical winds warp reality, quickening reflexes and amplifying blows.',
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

export function getWeatherEffect(weather: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS['Clear'];
}

/**
 * Strategy map: weather type → atmospheric opening line for the fight log.
 * null entries (Clear/Overcast) suppress the line entirely.
 */
const WEATHER_OPENING_LINES: Record<WeatherType, string | null> = {
  Clear: null,
  Overcast: null,
  Rainy: 'Rain slicks the sand — footwork will be treacherous today.',
  Sweltering: 'The air hangs thick and hot. Stamina will be the deciding factor.',
  Breezy: 'A cool breeze sweeps through the arena. The fighters look sharp.',
  'Blazing Sun': 'The sun beats down mercilessly. Heavy fighters will suffer.',
  Gale: 'Gale-force winds tear through the stands. Timing will be everything.',
  'Blood Moon': 'A crimson moon hangs overhead. The crowd is already baying for blood.',
  Eclipse: 'Darkness falls mid-day. An eerie calm descends before the violence.',
  Sandstorm: 'A howling sandstorm blinds the arena. Every breath is a battle.',
  Tornado: 'A terrifying tornado tears through the arena, throwing sand and debris everywhere.',
  Blizzard: 'A brutal blizzard freezes the arena. Survival is the only goal.',
  'Dense Fog': 'A thick mist swallows the fighters. Every shadow is a threat.',
  Mist: 'A light mist rolls across the sand, clinging to the fighters.',
  Thunderstorm: 'Thunder shakes the ground while lightning splits the sky.',
  Ashfall: 'Gray ash falls like snow. The air itself tastes of death.',
  'Acid Rain': 'Hissing rain burns the skin. This fight will be short and brutal.',
  'Mana Surge': 'The air crackles with power. The fighters move with impossible speed.',
  'Scorching Wind': 'A hot, dry wind sweeps the arena, parching throats and sapping strength.',
  'Spooky Night':
    'An unnatural chill settles over the arena, and shadows seem to move on their own.',
  'Meteor Shower':
    'The night sky burns with falling stars, casting chaotic shadows across the sand.',
  'Abyssal Gloom':
    'A terrifying, supernatural darkness swallows the arena. Fighters vanish into the abyssal gloom.',
  'Cursed Miasma':
    'A sickening purple miasma clings to the arena floor, draining life and hope alike.',
  Hailstorm: 'Ice falls from the sky like stones, battering armor and bare flesh alike.',
  'Solar Flare': 'A blinding flash of light bakes the arena. The sun itself seems to attack the fighters.',
  'Arcane Storm': 'The air rips open with raw arcane power. Reality itself seems to bend.',
  'Blood Rain': 'Thick red drops fall from an unnatural sky. The air smells of copper and dread.',
  'Locust Swarm': 'A deafening swarm of locusts descends upon the arena, gnawing at everything in sight.',
  'Aether Storm': 'Raw aether winds rip through the arena. The boundaries of reality are fraying.',
};

/**
 * Returns an atmospheric opening line for the fight log.
 * Returns null for neutral weather (Clear/Overcast) — no line is emitted.
 */
export function weatherOpeningLine(weather: WeatherType): string | null {
  return WEATHER_OPENING_LINES[weather] ?? null;
}
