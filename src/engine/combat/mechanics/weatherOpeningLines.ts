/**
 * Weather Opening Lines — atmospheric flavor text for the fight log.
 * Extracted from weatherEffects.ts for SRP separation.
 */
import type { WeatherType } from '@/types/shared.types';

/**
 * Strategy map: weather type → atmospheric opening line for the fight log.
 * null entries (Clear/Overcast) suppress the line entirely.
 */
const WEATHER_OPENING_LINES: Record<WeatherType, string | null> = {
  'Cosmic Anomaly':
    'A tear in the sky reveals the screaming void. Cosmic energies crackle across the sand.',
  'Abyssal Tempest':
    'An abyssal vortex rips across the arena, plunging the fighters into agonizing gloom.',

  'Prismatic Rain':
    'A strange, iridescent rain begins to fall. The air itself feels charged with anticipation.',
  'Eldritch Eclipse':
    'The sky turns a sickening purple as an Eldritch Eclipse blocks the sun. Madness descends.',
  'Moonlight Duel': 'The arena is silent save for the clash of steel under the pale moonlight.',

  Zephyr: 'A soothing zephyr sweeps across the sands, bringing a momentary peace.',
  'Wild Magic': 'Crackling energy arcs through the arena. Magic is in the air.',
  Clear: null,
  'Crimson Snow':
    'Blood-red snow falls silently, covering the arena in a thick, terrifying blanket of crimson.',
  Overcast: null,
  Rainy: 'Rain slicks the sand — footwork will be treacherous today.',
  Sweltering: 'The air hangs thick and hot. Stamina will be the deciding factor.',
  Breezy: 'A cool breeze sweeps through the arena. The fighters look sharp.',
  'Blazing Sun': 'The sun beats down mercilessly. Heavy fighters will suffer.',
  Gale: 'Gale-force winds tear through the stands. Timing will be everything.',
  'Eclipse of Chaos':
    'The sky darkens as a chaotic eclipse sets in, filling the arena with unnatural tension.',
  'Blood Moon': 'A crimson moon hangs overhead. The crowd is already baying for blood.',
  Eclipse: 'Darkness falls mid-day. An eerie calm descends before the violence.',
  Sandstorm: 'A howling sandstorm blinds the arena. Every breath is a battle.',
  Tornado: 'A terrifying tornado tears through the arena, throwing sand and debris everywhere.',
  Blizzard: 'A brutal blizzard freezes the arena. Survival is the only goal.',
  'Dense Fog': 'A thick mist swallows the fighters. Every shadow is a threat.',
  Mist: 'A light mist rolls across the sand, clinging to the fighters.',
  'Glittering Frost':
    'A beautiful, sharp glittering frost covers the arena. The air bites the lungs.',
  Thunderstorm: 'Thunder shakes the ground while lightning splits the sky.',
  Ashfall: 'Gray ash falls like snow. The air itself tastes of death.',
  'Acid Rain': 'Hissing rain burns the skin. This fight will be short and brutal.',
  'Mana Surge': 'The air crackles with power. The fighters move with impossible speed.',
  'Astral Dust': 'Shimmering astral dust falls from the sky, making movements erratic.',
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
  'Solar Flare':
    'A blinding flash of light bakes the arena. The sun itself seems to attack the fighters.',
  'Arcane Storm': 'The air rips open with raw arcane power. Reality itself seems to bend.',
  'Blood Rain': 'Thick red drops fall from an unnatural sky. The air smells of copper and dread.',
  'Locust Swarm':
    'A deafening swarm of locusts descends upon the arena, gnawing at everything in sight.',
  'Aurora Borealis':
    'The heavens are ablaze with ethereal, dancing lights. A serene calm settles over the sands.',
  'Chaotic Winds':
    'Fierce, swirling winds kick up the sand, creating unpredictable combat conditions.',
  'Aether Storm': 'Raw aether winds rip through the arena. The boundaries of reality are fraying.',
  Mirage: 'The arena shimmers with intense heat, causing the air itself to ripple with illusions.',
  Rainbow: 'A vibrant rainbow curves over the arena, bringing a moment of strange peace.',
  'Ember Rain': 'Glowing embers rain down from the sky, searing the sand and the fighters alike.',
  'Wildfire Smoke': 'A thick blanket of acrid smoke settles over the sands. Every breath burns.',
  'Gravity Anomaly':
    'The very air feels unnaturally light, then crushingly heavy. The laws of physics are breaking down.',
  'Blood Fog': 'A thick, crimson fog rolls across the arena, smelling of rust and death.',
  'Shimmering Heat': 'The air ripples with shimmering heat, distorting every shape upon the sands.',
  'Crystal Rain':
    'Sharp, shimmering crystals plummet from the sky. Blood will undoubtedly be drawn.',
  'Rain of Frogs':
    'The sky darkens and an absurd, writhing rain of frogs begins to fall, confusing everyone.',
  'Chaos Storm':
    'A swirling vortex of raw chaos descends upon the arena. Reality itself seems to fracture as the storm intensifies.',
  'Whispering Winds':
    'Unseen voices murmur through the arena. The fighters glance around nervously.',
  'Chaos Squall':
    'A chaotic squall of purple energy descends upon the arena, making every shadow twitch.',
  'Diamond Rain': 'A bizarre rain of diamonds begins to fall, cutting flesh and armor alike.',
  'Temporal Rift':
    "Reality shudders as a Temporal Rift opens. Time itself seems to bend to the fighters' will.",
  'Stardust Gale':
    'A shimmering gale of stardust sweeps the arena. Fighters move with hastened, exhausting speed.',
  'Mana Storm':
    "Raw mana erupts across the arena in crackling waves. The fighters' eyes glow with arcane fire.",
};

/**
 * Returns an atmospheric opening line for the fight log.
 * Returns null for neutral weather (Clear/Overcast) — no line is emitted.
 */
export function weatherOpeningLine(weather: WeatherType): string | null {
  return WEATHER_OPENING_LINES[weather] ?? null;
}
