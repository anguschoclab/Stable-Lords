// Split from data/arenas.ts — venue data
import type { ArenaConfig } from '@/types/shared.types';



export const THE_BRAMBLE_RING: ArenaConfig = {
  id: 'the_bramble_ring',
  name: 'The Bramble Ring',
  tags: ['cramped', 'uneven', 'outdoor', 'living'],
  tier: 1,
  size: 'cramped',
  description:
    'A tight clearing surrounded by dense, thorny overgrowth. Blood only encourages the roots.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.1 },
};



export const THUNDER_PEAK: ArenaConfig = {
  id: 'thunder_peak',
  name: 'Thunder Peak',
  tags: ['open', 'elevated', 'outdoor'],
  tier: 3,
  size: 'open',
  description:
    'Atop the highest jagged spire, thin air and sheer drops test the stamina and nerves of any fighter.',
  zoneDef: { Edge: -1, Corner: -5 },
  surfaceMod: { initiativeMod: 0, riposteMod: 0, enduranceMult: 1.25 },
};



export const SUN_BAKED_PLATEAU: ArenaConfig = {
  id: 'sun_baked_plateau',
  name: 'Sun-Baked Plateau',
  tags: ['open', 'elevated', 'outdoor', 'cursed'],
  tier: 2,
  size: 'open',
  description:
    'A desolate, cursed high plateau bathed in relentless sunlight. Stamina is heavily tested.',
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: 0, riposteMod: 0, enduranceMult: 1.3 },
};



export const ANCIENT_AQUEDUCT: ArenaConfig = {
  id: 'ancient_aqueduct',
  name: 'Ancient Aqueduct',
  tags: ['water', 'ruins', 'cramped'],
  tier: 1,
  size: 'cramped',
  description: 'Cramped, flooded stone corridors that punish long weapons and footwork.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 0, enduranceMult: 1.15 },
};



export const FORGOTTEN_CRYPT: ArenaConfig = {
  id: 'forgotten_crypt',
  name: 'Forgotten Crypt',
  tags: ['indoor', 'cramped', 'cursed'],
  tier: 2,
  size: 'cramped',
  description:
    'A subterranean burial chamber where the shadows seem to swallow the light, hiding fatal mistakes.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.1 },
};



export const RUSTED_GORGE: ArenaConfig = {
  id: 'rusted_gorge',
  name: 'Rusted Gorge',
  tags: ['outdoor', 'uneven', 'open'],
  tier: 1,
  size: 'open',
  description:
    'An ancient industrial trench filled with twisted scrap metal and treacherous, uneven terrain.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.2 },
};




export const THE_ASYLUM: ArenaConfig = {
  id: 'the_asylum',
  name: 'The Asylum',
  tags: ['indoor', 'cramped', 'cursed'],
  tier: 2,
  size: 'cramped',
  description: 'A maddening enclosed space echoing with the screams of past victims. Stamina drains quickly.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.25 },
};




export const VOLCANIC_CRATER: ArenaConfig = {
  id: 'volcanic_crater',
  name: 'Volcanic Crater',
  tags: ['outdoor', 'elevated', 'uneven', 'living'],
  tier: 3,
  size: 'open',
  description: 'An unstable volcanic rim that occasionally spews ash and fire. Heat is unbearable.',
  zoneDef: { Edge: -2, Corner: -6 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.35 },
};



export const THE_WAILING_CHASM: ArenaConfig = {
  id: 'the_wailing_chasm',
  name: 'The Wailing Chasm',
  tags: ['cramped', 'uneven', 'outdoor', 'cursed'],
  tier: 2,
  size: 'cramped',
  description: 'A cursed, narrow chasm filled with wailing winds that distract the mind.',
  zoneDef: { Edge: -2, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 0, enduranceMult: 1.1 },
};



export const SHATTERED_MONOLITH: ArenaConfig = {
  id: 'shattered_monolith',
  name: 'Shattered Monolith',
  tags: ['elevated', 'ruins', 'magical', 'open'],
  tier: 3,
  size: 'open',
  description: 'An ancient, magical monolith fractured into floating, elevated platforms.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: 0, riposteMod: 1, enduranceMult: 1.0 },
};



export const VERDANT_LABYRINTH: ArenaConfig = {
  id: 'verdant_labyrinth',
  name: 'Verdant Labyrinth',
  tags: ['cramped', 'living', 'outdoor', 'water'],
  tier: 2,
  size: 'cramped',
  description: 'A flooded, living labyrinth of vines and roots that actively grabs at fighters.',
  zoneDef: { Edge: -1, Corner: -3 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.2 },
};



export const THE_SHIFTING_SANDS: ArenaConfig = {
  id: 'the_shifting_sands',
  name: 'The Shifting Sands',
  tags: ['open', 'uneven', 'outdoor'],
  tier: 2,
  size: 'open',
  description: 'Deep, unstable dunes that constantly shift underfoot, heavily penalizing sudden movements.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -3, riposteMod: 0, enduranceMult: 1.25 },
};



export const THE_CURSED_SWAMP: ArenaConfig = {
  id: 'the_cursed_swamp',
  name: 'The Cursed Swamp',
  tags: ['cramped', 'water', 'cursed'],
  tier: 2,
  size: 'cramped',
  description: 'A foul, waist-deep quagmire steeped in dark magic. Movement is sluggish and the air breathes despair.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.4 },
};



export const THE_JAGGED_PEAK: ArenaConfig = {
  id: 'the_jagged_peak',
  name: 'The Jagged Peak',
  tags: ['open', 'elevated', 'uneven', 'cursed'],
  tier: 3,
  size: 'open',
  description: 'A perilous, cursed summit where unpredictable gales and treacherous rocks test even the most skilled combatants.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: 0, enduranceMult: 1.25 },
};



export const THE_MURKY_DEPTHS: ArenaConfig = {
  id: 'the_murky_depths',
  name: 'The Murky Depths',
  tags: ['cramped', 'water', 'indoor', 'magical'],
  tier: 2,
  size: 'cramped',
  description: 'A flooded, arcane cavern that disorients fighters while amplifying magical resonances.',
  zoneDef: { Edge: -2, Corner: -4 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.2 },
};



export const THE_SMOLDERING_PITS: ArenaConfig = {
  id: 'the_smoldering_pits',
  name: 'The Smoldering Pits',
  tags: ['open', 'living', 'outdoor', 'ruins'],
  tier: 2,
  size: 'open',
  description: 'Ancient ruins set ablaze by natural vents, creating a shifting, hazardous battlefield.',
  zoneDef: { Edge: -1, Corner: -4 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.3 },
};



export const THE_CRYSTAL_SPIRE: ArenaConfig = {
  id: 'the_crystal_spire',
  name: 'The Crystal Spire',
  tags: ['cramped', 'elevated', 'magical', 'indoor'],
  tier: 3,
  size: 'cramped',
  description: 'A towering, enclosed spire of humming crystals. Movements are mirrored and distorted by arcane light.',
  zoneDef: { Edge: -4, Corner: -6 },
  surfaceMod: { initiativeMod: 1, riposteMod: 2, enduranceMult: 1.15 },
};



export const THE_IRON_CAGE: ArenaConfig = {
  id: 'the_iron_cage',
  name: 'The Iron Cage',
  tags: ['cramped', 'indoor', 'premium'],
  tier: 3,
  size: 'cramped',
  description: 'An elite, brutal fighting pit enclosed in spiked iron bars, designed for maximum bloodshed and crowd excitement.',
  zoneDef: { Edge: -4, Corner: -6 },
  surfaceMod: { initiativeMod: 1, riposteMod: -1, enduranceMult: 1.1 },
};

export const THE_FROZEN_LAKE: ArenaConfig = {
  id: 'the_frozen_lake',
  name: 'The Frozen Lake',
  tags: ['water', 'outdoor', 'open'],
  tier: 2,
  size: 'open',
  description: 'A frozen lake where footing is treacherous and the cold bites deep.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -1, riposteMod: -1, enduranceMult: 1.2 },
};

export const THE_ACID_BOG: ArenaConfig = {
  id: 'the_acid_bog',
  name: 'The Acid Bog',
  tags: ['water', 'cursed', 'uneven'],
  tier: 3,
  size: 'cramped',
  description: 'A bubbling, corrosive swamp steeped in dark magic.',
  zoneDef: { Edge: -2, Corner: -5 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.3 },
};
