import type { ArenaConfig, ArenaTag } from '@/types/shared.types';

const registry = new Map<string, ArenaConfig>();

// Internal caches for optimized retrieval
let allCache: ArenaConfig[] | null = null;
const tagIndex = new Map<ArenaTag, ArenaConfig[]>();
const tierIndex = new Map<number, ArenaConfig[]>();

/**
 * Register an arena config in the global registry.
 * Clears internal caches on change.
 * @param arena - Arena configuration to register.
 */
export function registerArena(arena: ArenaConfig): void {
  registry.set(arena.id, arena);
  // Clear caches on registry change
  allCache = null;
  tagIndex.clear();
  tierIndex.clear();
}

/**
 * Get arena by id.
 * @param id - Arena identifier.
 * @returns The ArenaConfig, or STANDARD_ARENA if not found.
 */
export function getArenaById(id: string): ArenaConfig {
  return registry.get(id) ?? STANDARD_ARENA;
}

/**
 * Get all registered arenas.
 * @returns Array of all ArenaConfig entries.
 */
export function getAllArenas(): ArenaConfig[] {
  if (!allCache) {
    allCache = Array.from(registry.values());
  }
  return [...allCache];
}

/**
 * Get arenas filtered by a specific tag.
 * @param tag - Arena tag to filter by.
 * @returns Array of arenas matching the tag.
 */
export function getArenasByTag(tag: ArenaTag): ArenaConfig[] {
  let results = tagIndex.get(tag);
  if (!results) {
    results = getAllArenas().filter((a) => a.tags.includes(tag));
    tagIndex.set(tag, results);
  }
  return [...results];
}

/**
 * Get arenas filtered by tier level.
 * @param tier - Tier level (1, 2, or 3).
 * @returns Array of arenas at the specified tier.
 */
export function getArenasByTier(tier: 1 | 2 | 3): ArenaConfig[] {
  let results = tierIndex.get(tier);
  if (!results) {
    results = getAllArenas().filter((a) => a.tier === tier);
    tierIndex.set(tier, results);
  }
  return [...results];
}

/**
 * Check if an arena is indoors.
 * @param id - Arena identifier (optional).
 * @returns True if the arena has the 'indoor' tag.
 */
export function isIndoorArena(id?: string): boolean {
  if (!id) return false;
  const arena = registry.get(id);
  return !!arena?.tags.includes('indoor');
}

// ─── Seed Arenas ─────────────────────────────────────────────────────────────

/**
 * The baseline arena — flat sand, no modifiers, neutral footing.
 */
export const STANDARD_ARENA: ArenaConfig = {
  id: 'standard_arena',
  name: 'The Proving Grounds',
  tags: ['outdoor', 'open'],
  tier: 1,
  size: 'standard',
  description: 'A flat, sandy arena. No particular advantage to either style.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
  startingZone: 'Center',
};

/**
 * Sunken, rain-soaked arena with treacherous footing.
 */

export const BRASS_RING: ArenaConfig = {
  id: 'brass_ring',
  name: 'The Brass Ring',
  tags: ['outdoor', 'cramped', 'uneven'],
  tier: 1,
  size: 'cramped',
  description: 'A tiny, brutal ring with uneven stones that penalize lunging and favor close-quarters brawling.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.1, riposteMod: 1 },
  startingZone: 'Center',
};

export const NARROW_BRIDGE: ArenaConfig = {
  id: 'narrow_bridge',
  name: 'The Narrow Bridge',
  tags: ['outdoor', 'cramped', 'elevated'],
  tier: 2,
  size: 'cramped',
  description: 'A dizzying span where low endurance fighters struggle to breathe and long weapons are useless.',
  zoneDef: { Edge: -5, Corner: -6 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.2, riposteMod: 0 },
  startingZone: 'Center',
};

export const MUDPIT_ARENA: ArenaConfig = {
  id: 'mudpit_arena',
  name: 'The Mudpit',
  tags: ['outdoor', 'water'],
  tier: 1,
  size: 'standard',
  description: 'A sunken, rain-soaked arena. Footing is treacherous.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: -1 },
  startingZone: 'Center',
};

/**
 * The grand arena — fine sand, neutral footing, premium venue.
 */
export const BLOODSANDS_ARENA: ArenaConfig = {
  id: 'bloodsands_arena',
  name: 'The Bloodsands',
  tags: ['outdoor', 'open', 'premium'],
  tier: 2,
  // 'standard' keeps the full Grapple→Extended range ladder available to all
  // weapon types without the 'open' flag's future extended-reach bias.
  size: 'standard',
  description: 'The grand arena. Fine sand, firm and even footing — no surface favours any style.',
  // Mirror the Proving Grounds zone penalties exactly so cornering pressure
  // is identical to the baseline neutral arena.
  zoneDef: { Edge: -2, Corner: -4 },
  // All three surface modifiers zeroed: no initiative, endurance, or riposte skew.
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
  startingZone: 'Center',
};

/**
 * Torch-lit subterranean pit with tight quarters.
 */
export const UNDERPIT_ARENA: ArenaConfig = {
  id: 'underpit_arena',
  name: 'The Underpit',
  tags: ['indoor', 'cramped'],
  tier: 2,
  size: 'cramped',
  description: 'A torch-lit subterranean pit. Tight quarters favour close-range fighters.',
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -1 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: 0 },
  startingZone: 'Center',
};

export const HIGHPLAIN_ARENA: ArenaConfig = {
  id: 'highplain_arena',
  name: 'The High Plain',
  tags: ['outdoor', 'open'],
  tier: 2,
  size: 'open',
  description:
    'A wind-swept highland plateau. Long sight lines and open ground favour reach weapons and fighters who want distance.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.0, riposteMod: 0 },
  startingZone: 'Center',
};

// Indoor, standard size — full range ladder, riposte-friendly acoustics.
export const LANTERN_HALL_ARENA: ArenaConfig = {
  id: 'lantern_hall_arena',
  name: 'The Lantern Hall',
  tags: ['indoor', 'premium'],
  tier: 2,
  size: 'standard',
  description:
    'A grand torch-lit hall with vaulted ceilings and raised galleries. The enclosed space lets fighters read each other clearly — counter-fighting styles thrive here.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 1 },
  startingZone: 'Center',
};

// Outdoor, cramped — compact walled courtyard; the only cramped arena without a roof.
export const WALLED_COURT_ARENA: ArenaConfig = {
  id: 'walled_court_arena',
  name: 'The Walled Court',
  tags: ['outdoor', 'cramped'],
  tier: 1,
  size: 'cramped',
  description:
    'A tight stone courtyard hemmed in on all sides. Reach weapons are a liability here; the confined angles reward fighters who can counter and punish over-extension.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 1 },
  startingZone: 'Center',
};

// Elevated, outdoor — the only arena using the 'elevated' tag.
export const CLIFFTOP_ARENA: ArenaConfig = {
  id: 'clifftop_arena',
  name: 'The Clifftop',
  tags: ['outdoor', 'elevated'],
  tier: 3,
  size: 'standard',
  description:
    'A stone platform carved into a high cliff face. Buffeting winds make initiative reads unreliable and push tired fighters toward the edge faster.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.05, riposteMod: 0 },
  startingZone: 'Center',
};

// Indoor, water, cramped — the most punishing arena in the circuit.
export const FLOODED_VAULT_ARENA: ArenaConfig = {
  id: 'flooded_vault_arena',
  name: 'The Flooded Vault',
  tags: ['indoor', 'water', 'cramped'],
  tier: 3,
  size: 'cramped',
  description:
    'A subterranean vault knee-deep in murky water. Cramped quarters and the gruelling drag of the water make this the most exhausting arena; only the hardiest survive deep into a fight.',
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -2 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.25, riposteMod: -1 },
  startingZone: 'Center',
};

// ─── New Arena Variations ────────────────────────────────────────────────────

// Outdoor, uneven, ruins — ancient arena with treacherous footing
export const SUNDERED_COLISEUM: ArenaConfig = {
  id: 'sundered_coliseum',
  name: 'The Sundered Coliseum',
  tags: ['outdoor', 'uneven', 'ruins'],
  tier: 2,
  size: 'standard',
  description:
    'Ancient arena crumbling into disrepair. Uneven footing from broken flagstones punishes fast movers and favors careful footwork.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.05, riposteMod: -1 },
  startingZone: 'Center',
};

// Indoor, water, cramped, uneven — flooded sacred site
export const SUNKEN_TEMPLE: ArenaConfig = {
  id: 'sunken_temple',
  name: 'The Sunken Temple',
  tags: ['indoor', 'water', 'cramped', 'uneven'],
  tier: 3,
  size: 'cramped',
  description:
    'Flooded sanctuary with submerged altars. Treacherous footing in sacred waters exhausts even hardy fighters.',
  zoneDef: { Edge: -3, Corner: -5, Obstacle: -2 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.2, riposteMod: -2 },
  startingZone: 'Center',
};

// Indoor, cramped, magical — crystal chamber with magical resonance
export const CRYSTAL_CAVERN: ArenaConfig = {
  id: 'crystal_cavern',
  name: 'The Crystal Cavern',
  tags: ['indoor', 'cramped', 'magical'],
  tier: 3,
  size: 'cramped',
  description:
    'Luminescent crystal chamber. Echoes amplify ripostes; tight quarters favor grapplers and short weapons.',
  zoneDef: { Edge: -2, Corner: -3 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 0.95, riposteMod: 2 },
  startingZone: 'Center',
};

// Outdoor, open, uneven, living — shifting forest floor
export const WHISPERING_GROVE: ArenaConfig = {
  id: 'whispering_grove',
  name: 'The Whispering Grove',
  tags: ['outdoor', 'open', 'uneven', 'living'],
  tier: 2,
  size: 'open',
  description:
    'Ancient grove with shifting root systems. Living forest watches and reacts to the battle, tangling the feet of lungers.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.0, riposteMod: 1 },
  startingZone: 'Center',
};

// Indoor, cramped, elevated, cursed — built over mass graves
export const CHARNEL_PITS: ArenaConfig = {
  id: 'charnel_pits',
  name: 'The Charnel Pits',
  tags: ['indoor', 'cramped', 'elevated', 'cursed'],
  tier: 2,
  size: 'cramped',
  description:
    'Arena built over mass graves. Blood stains the ancient stones; violence feels inevitable here, especially under a blood moon.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
  startingZone: 'Center',
};

// Outdoor, uneven, living, cursed — carnivorous flora
export const FLESH_GARDENS: ArenaConfig = {
  id: 'flesh_gardens',
  name: 'The Flesh Gardens',
  tags: ['outdoor', 'uneven', 'living', 'cursed'],
  tier: 3,
  size: 'standard',
  description:
    'Twisted garden of carnivorous flora. The ground itself hungers; heavy-footed bashers crush thorns while nimble fighters risk entanglement.',
  zoneDef: { Edge: -2, Corner: -4, Obstacle: -3 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: 0 },
  startingZone: 'Center',
};

// ─── Arena Lore ───────────────────────────────────────────────────────────────

/**
 * Arena lore entry type.
 */
export type ArenaLoreType = 'historical_battle' | 'famous_death' | 'architectural_quirk';

/**
 * Defines the shape of arena lore entry.
 */
export interface ArenaLoreEntry {
  id: string;
  arenaId: string;
  type: ArenaLoreType;
  title: string;
  narrative: string;
}

/**
 * Historical events, famous deaths, and architectural quirks for arenas.
 */

// Outdoor, cramped, uneven — brutal gutter pit
export const GUTTER_PIT: ArenaConfig = {
  id: 'gutter_pit',
  name: 'The Gutter Pit',
  tags: ['outdoor', 'cramped', 'uneven'],
  tier: 1,
  size: 'cramped',
  description: 'A miserable, uneven pit. Tight quarters and broken ground punish lungers and favor dirty fighting.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.1, riposteMod: 0 },
  startingZone: 'Center',
};

// Outdoor, elevated, open — stormy terrace
export const STORMTOP_TERRACE: ArenaConfig = {
  id: 'stormtop_terrace',
  name: 'Stormtop Terrace',
  tags: ['outdoor', 'elevated', 'open'],
  tier: 2,
  size: 'open',
  description: 'An open terrace high above the city. The thin air and open space heavily penalize low-endurance fighters.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.15, riposteMod: 0 },
  startingZone: 'Center',
};


export const GLACIAL_RIFT: ArenaConfig = {
  id: 'glacial_rift',
  name: 'The Glacial Rift',
  tags: ['outdoor', 'cramped', 'uneven'],
  tier: 2,
  size: 'cramped',
  description: 'A frozen, narrow crevasse where footing is treacherous and space is tight.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, enduranceMult: 1.1, riposteMod: 1 },
  startingZone: 'Center',
};

export const SKY_PLATFORM: ArenaConfig = {
  id: 'sky_platform',
  name: 'The Sky Platform',
  tags: ['outdoor', 'elevated', 'open'],
  tier: 3,
  size: 'open',
  description: 'A floating stone platform high above the clouds. Thin air and high winds challenge stamina and precision.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.2, riposteMod: 0 },
  startingZone: 'Center',
};

export const MISTY_VALLEY: ArenaConfig = {
  id: 'misty_valley',
  name: 'The Misty Valley',
  tags: ['outdoor', 'open', 'magical'],
  tier: 1,
  size: 'open',
  description: 'A wide valley filled with shifting, magically infused mists. Perfect for those who rely on reflexes over raw sight.',
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 2 },
  startingZone: 'Center',
};

export const ARENA_LORE: ArenaLoreEntry[] = [
  {
    id: 'flesh_gardens_the_crimson_bloom',
    arenaId: 'flesh_gardens',
    type: 'historical_battle',
    title: 'The Crimson Bloom',
    narrative: 'In 962, a gladiator known only as The Scythe fought off twelve feral beasts simultaneously. The blood spilled that day caused a rare species of blood-lily to bloom across the arena floor, a phenomenon that has never occurred since.',
  },
  {
    id: 'walled_court_hidden_grates',
    arenaId: 'walled_court_arena',
    type: 'architectural_quirk',
    title: 'The Whispering Grates',
    narrative: 'Beneath the polished stone of the Walled Court lie ancient drainage grates. Fighters with sharp ears claim they can hear the murmurs of past champions warning them of unseen attacks from below.',
  },
  {
    id: 'charnel_pits_the_last_stand_of_korr',
    arenaId: 'charnel_pits',
    type: 'famous_death',
    title: 'The Last Stand of Korr',
    narrative: 'Korr the Unbroken met his end in the Charnel Pits, not by the blade of a foe, but when the unstable ground gave way beneath him, swallowing him into the toxic depths. His final defiant roar is said to still echo in the pits.',
  },
  {
    id: 'flesh_gardens_thorny_path',
    arenaId: 'flesh_gardens',
    type: 'architectural_quirk',
    title: 'The Thorny Path',
    narrative:
      'Due to the overgrowth of mutated flora in the Flesh Gardens, the outer edges of the pit are laced with razor-sharp vines. Fighters pushed to the perimeter often suffer lacerations before a weapon ever strikes them.',
  },
  {
    id: 'walled_court_kings_fall',
    arenaId: 'walled_court_arena',
    type: 'historical_battle',
    title: 'The Fall of the Mad King',
    narrative:
      "In 981, a disgraced noble challenged the reigning champion in the Walled Court. The battle lasted less than a minute, ending with the noble's severed head rolling into the royal viewing box, a stark reminder of the arena's brutal equality.",
  },
  {
    id: 'charnel_pits_silent_night',
    arenaId: 'charnel_pits',
    type: 'historical_battle',
    title: 'The Silent Night of Skulls',
    narrative:
      'In 948, a brutal gang war spilled into the pits. For three days, gladiators fought alongside their owners against an invading mercenary band. The fighting was so fierce that even the crowd took up arms.',
  },
  {
    id: 'lantern_hall_glass_rain',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: 'The Glass Rain',
    narrative:
      'When the great chandelier of the Lantern Hall fell in 962 during an explosive magical duel, the arena floor was seeded with thousands of lethal glass shards that are still occasionally unearthed by a careless footstep.',
  },
  {
    id: 'walled_court_shattered_shield',
    arenaId: 'walled_court_arena',
    type: 'historical_battle',
    title: 'The Shattered Shield',
    narrative:
      'In a desperate final stand, a lone defender used the tightly packed stone walls to brace their shield against three attackers simultaneously. The shield eventually burst into splinters, but the distraction lasted just long enough for the match timer to run out, cementing a legendary draw.',
  },
  {
    id: 'flooded_drowning_chorus',
    arenaId: 'flooded_vault_arena',
    type: 'architectural_quirk',
    title: 'The Drowning Chorus',
    narrative:
      'When the tide rolls in, the water passing through the iron grates produces a low, mournful hum. Fighters claim it sounds exactly like the last breaths of the drowned prisoners the vault was built over.',
  },
  {
    id: 'flooded_vault_rusting_tide',
    arenaId: 'flooded_vault_arena',
    type: 'architectural_quirk',
    title: 'The Rusting Tide',
    narrative:
      'The iron grates that line the vault floor have corroded for centuries, leaving jagged edges that catch the unwary. Fighters who fall near the grates often rise with rust-red streaks across their armor, as though the arena itself has drawn blood.',
  },
  {
    id: 'highplain_howling_gale',
    arenaId: 'highplain_arena',
    type: 'architectural_quirk',
    title: 'The Howling Gale',
    narrative:
      'The exposed plateau offers no shelter from the relentless winds. During the Great Storm of 971, three bouts were cancelled when fighters could not remain standing. The howling is said to carry the voices of warriors lost to the wind.',
  },
  {
    id: 'standard_arena_first_blood',
    arenaId: 'standard_arena',
    type: 'historical_battle',
    title: 'The First Blood',
    narrative:
      'Though it is now the most common proving ground, the Standard Arena was once a grand amphitheater. Legend has it the very first match ended in a mutual strike that blinded both fighters, a testament to the brutal equality of the sands.',
  },
  {
    id: 'walled_court_kings_gambit',
    arenaId: 'walled_court_arena',
    type: 'famous_death',
    title: "The King's Gambit",
    narrative:
      'A flamboyant duelist attempted a spinning strike off the tightly packed stone walls, only to slip on a patch of moss. The misstep allowed a hulking brute to pin them against the wall and deliver a slow, excruciating execution that lasted until the sun set.',
  },
  {
    id: 'sunken_temple_drowned_prayers',
    arenaId: 'sunken_temple',
    type: 'architectural_quirk',
    title: 'The Drowned Prayers',
    narrative:
      'The acoustics of the partially submerged temple are eerie. The splashing of water often sounds like the frantic, mumbled prayers of the priests who drowned when the temple first sank centuries ago.',
  },
  {
    id: 'bloodsands_massacre_thirty',
    arenaId: 'bloodsands_arena',
    type: 'historical_battle',
    title: 'The Massacre of the Thirty',
    narrative:
      'Three hundred warriors died in a single day when a riot broke out during a mass execution bout. The sand was so saturated with blood that arena workers had to replace it three times.',
  },
  {
    id: 'underpit_whispering_stones',
    arenaId: 'underpit_arena',
    type: 'architectural_quirk',
    title: 'The Whispering Stones',
    narrative:
      'Ancient limestone walls carry sound in impossible ways. Fighters report hearing confessions from warriors long dead echoing from the stones during quiet moments.',
  },
  {
    id: 'flooded_drowning_seat',
    arenaId: 'flooded_vault_arena',
    type: 'famous_death',
    title: 'The Drowning Seat',
    narrative:
      "A submerged stone chair where condemned prisoners were once chained to await the rising tide. Now it serves as the referee's station during bouts.",
  },
  {
    id: 'mudpit_bone_harvest',
    arenaId: 'mudpit_arena',
    type: 'historical_battle',
    title: 'The Bone Harvest',
    narrative:
      'After an abnormally long monsoon season, a fifty-man battle royale turned into a slog through waist-deep mud. The final survivor collapsed and drowned in a puddle just moments after the final bell.',
  },
  {
    id: 'charnel_pits_screaming_winds',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: 'The Screaming Winds',
    narrative:
      'Gaps in the ancient stonework catch the wind perfectly, causing a sound identical to a chorus of shrieking men. Many new fighters find their morale breaking before a blow is even struck.',
  },
  {
    id: 'sundered_coliseum_fallen_pillar',
    arenaId: 'sundered_coliseum',
    type: 'famous_death',
    title: 'The Fallen Pillar',
    narrative:
      'A legendary champion met his end not from a weapon, but when a stray hammer throw struck a weakened marble pillar, collapsing it directly onto him and three of his challengers.',
  },
  {
    id: 'lantern_hall_architects_folly',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: "The Architect's Folly",
    narrative:
      'The original blueprints called for a vaulted ceiling entirely made of glass. During its maiden bout, the thunderous cheers shattered it, showering the fighters in lethal shards. The roof was rebuilt with heavy timber, but fighters still occasionally find glints of glass embedded in the packed sand.',
  },
  {
    id: 'crystal_cavern_shattered_echo',
    arenaId: 'crystal_cavern',
    type: 'historical_battle',
    title: 'The Shattered Echo',
    narrative:
      'In a furious exchange of maces, two colossal basher archetypes struck the central crystal spire simultaneously. The resulting harmonic blast deafened everyone in attendance and ruptured the eardrums of both fighters. The match was declared a draw when neither could find their footing again.',
  },
  {
    id: 'whispering_grove_blood_roots',
    arenaId: 'whispering_grove',
    type: 'famous_death',
    title: 'The Grasp of the Blood Roots',
    narrative:
      'An overconfident agility fighter ignored the subtle shifting of the forest floor, only to have their foot caught in a sudden snare of roots. Their opponent leisurely approached and delivered the killing blow while the forest itself seemed to hold the victim in place.',
  },
  {
    id: 'flesh_gardens_crimson_bloom',
    arenaId: 'flesh_gardens',
    type: 'historical_battle',
    title: 'The Crimson Bloom',
    narrative:
      'During a particularly savage mid-summer festival, so much blood was spilled that the dormant blood-vines erupted into violent bloom, entangling and consuming half the remaining fighters.',
  },
  {
    id: 'lantern_hall_shadow_strike',
    arenaId: 'lantern_hall_arena',
    type: 'famous_death',
    title: 'The Shadow Strike',
    narrative:
      "A cunning rogue bypassed a champion's legendary guard by timing their fatal thrust perfectly with a flickering torch, momentarily blinding their opponent in a sudden play of light and shadow.",
  },
  {
    id: 'sundered_coliseum_blood_pact',
    arenaId: 'sundered_coliseum',
    type: 'historical_battle',
    title: 'The Blood Pact of the Unbroken',
    narrative:
      "Two rival champions, exhausted and bleeding, refused to strike the final blow against each other. They stood back-to-back, defying the crowd's demands for blood until the arena guards were sent in to execute them both.",
  },
  {
    id: 'lantern_hall_burning_shadow',
    arenaId: 'lantern_hall_arena',
    type: 'famous_death',
    title: 'The Burning Shadow',
    narrative:
      'A notorious assassin attempted to use the flickering torchlight to obscure their movements, but misjudged the shadows. Their opponent, predicting the maneuver, impaled them on a wall sconce, leaving them to burn as a macabre spectacle.',
  },
  {
    id: 'crystal_cavern_singing_shards',
    arenaId: 'crystal_cavern',
    type: 'architectural_quirk',
    title: 'The Singing Shards',
    narrative:
      'Certain crystal formations in the cavern vibrate at a specific frequency when struck by steel. Skilled fighters use this to their advantage, creating a disorienting, high-pitched resonance that throws opponents off balance.',
  },
  {
    id: 'standard_arena_kings_folly',
    arenaId: 'standard_arena',
    type: 'famous_death',
    title: "The King's Folly",
    narrative:
      'A minor lord disguised himself to fight for glory but stumbled on his own oversized scabbard. His unknown opponent granted him no quarter, decapitating him before the crowd even realized royal blood had been spilled.',
  },
  {
    id: 'charnel_pits_breath_of_decay',
    arenaId: 'charnel_pits',
    type: 'architectural_quirk',
    title: 'The Breath of Decay',
    narrative:
      'Deep vents occasionally release plumes of noxious, rusted gas from the pits below. Fights are often decided by who can hold their breath the longest while executing a flurry of strikes in the blinding fog.',
  },
  {
    id: 'lantern_hall_blind_monk',
    arenaId: 'lantern_hall_arena',
    type: 'historical_battle',
    title: "The Blind Monk's Stand",
    narrative:
      'When all the lanterns were mysteriously extinguished midway through a championship bout, a blind ascetic monk defeated three armed gladiators in total darkness, guided only by the sound of their footfalls on the wooden floorboards.',
  },
  {
    id: 'lantern_hall_forgotten_chains',
    arenaId: 'lantern_hall_arena',
    type: 'architectural_quirk',
    title: 'The Forgotten Chains',
    narrative:
      "Hidden beneath the shifting sands are the rusted iron chains of the old slave pens. Unlucky fighters occasionally find their feet snagged by these grim reminders of the arena's past, leading to sudden and brutal shifts in momentum.",
  },
  {
    id: 'charnel_pits_blind_executioner',
    arenaId: 'charnel_pits',
    type: 'famous_death',
    title: 'The Blind Executioner',
    narrative:
      'A massive brute whose helm had fused to his face in a terrible accident fought his final battle here. Blinded, he relied entirely on the shrieking winds of the pits to locate his prey, culminating in a horrific double-decapitation of two agility fighters who failed to walk silently.',
  },
];

// ─── Auto-register ────────────────────────────────────────────────────────────
[
  STANDARD_ARENA,
  MUDPIT_ARENA,
  BLOODSANDS_ARENA,
  UNDERPIT_ARENA,
  HIGHPLAIN_ARENA,
  LANTERN_HALL_ARENA,
  WALLED_COURT_ARENA,
  CLIFFTOP_ARENA,
  FLOODED_VAULT_ARENA,
  SUNDERED_COLISEUM,
  SUNKEN_TEMPLE,
  CRYSTAL_CAVERN,
  WHISPERING_GROVE,
  CHARNEL_PITS,
  FLESH_GARDENS,
  GUTTER_PIT,
  STORMTOP_TERRACE,
  GLACIAL_RIFT,
  SKY_PLATFORM,
  MISTY_VALLEY,
  BRASS_RING,
  NARROW_BRIDGE,
].forEach(registerArena);
