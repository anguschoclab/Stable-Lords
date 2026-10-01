// Split from data/arenas.ts — venue data
import type { ArenaConfig } from '@/types/shared.types';

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
  description:
    'A miserable, uneven pit. Tight quarters and broken ground punish lungers and favor dirty fighting.',
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
  description:
    'An open terrace high above the city. The thin air and open space heavily penalize low-endurance fighters.',
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
  description:
    'A floating stone platform high above the clouds. Thin air and high winds challenge stamina and precision.',
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
  description:
    'A wide valley filled with shifting, magically infused mists. Perfect for those who rely on reflexes over raw sight.',
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 2 },
  startingZone: 'Center',
};

export const THE_MEAT_GRINDER: ArenaConfig = {
  id: 'the_meat_grinder',
  name: 'The Meat Grinder',
  tags: ['cramped', 'uneven', 'outdoor', 'cursed'],
  tier: 2,
  size: 'cramped',
  description: 'A terrifying, tight, uneven cursed pit.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.2, riposteMod: 1 },
  startingZone: 'Center',
};

export const JUNGLE_RUINS: ArenaConfig = {
  id: 'jungle_ruins',
  zoneDef: { Edge: -1, Corner: -2 },
  name: 'Jungle Ruins',
  description: 'Ancient stonework reclaimed by aggressive flora.',
  tier: 2,
  size: 'cramped',
  tags: ['cramped', 'uneven', 'outdoor', 'ruins', 'living'],
  surfaceMod: {
    initiativeMod: -1,
    riposteMod: 1,
    enduranceMult: 1.1,
  },
};

export const THE_ABYSSAL_PIT: ArenaConfig = {
  id: 'the_abyssal_pit',
  name: 'The Abyssal Pit',
  tags: ['indoor', 'elevated', 'magical', 'cramped'],
  tier: 3,
  size: 'cramped',
  description: 'An elevated, magical indoor platform where space is tight.',
  zoneDef: { Edge: -4, Corner: -6 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.1, riposteMod: 2 },
  startingZone: 'Center',
};

export const THE_SUNKEN_VAULT: ArenaConfig = {
  id: 'the_sunken_vault',
  name: 'The Sunken Vault',
  tags: ['water', 'indoor', 'magical'],
  tier: 2,
  size: 'cramped',
  description: 'A submerged treasure room where ancient magic and knee-deep water slow movement.',
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.15, riposteMod: 1 },
};

export const IRON_FORGE: ArenaConfig = {
  id: 'iron_forge',
  name: 'Iron Forge',
  tags: ['cramped', 'indoor', 'premium'],
  tier: 3,
  size: 'cramped',
  description:
    'An intense, claustrophobic forge reserved for the elite. Sparks fly with every clash.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 1, enduranceMult: 1.3, riposteMod: 0 },
};
