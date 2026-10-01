// Split from data/arenas.ts — venue data
import type { ArenaConfig } from '@/types/shared.types';

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

export const MIST_SHROUDED_RUINS: ArenaConfig = {
  id: 'mist_shrouded_ruins',
  name: 'Mist-Shrouded Ruins',
  tags: ['ruins', 'magical', 'outdoor'],
  tier: 2,
  description: 'Ancient, crumbling walls obscured by an unnatural fog.',
  size: 'open',
  zoneDef: { Edge: -2 },
  surfaceMod: { initiativeMod: -1, riposteMod: 1, enduranceMult: 1.0 },
};

export const THE_GALLOWS_TREE: ArenaConfig = {
  id: 'the_gallows_tree',
  name: 'The Gallows Tree',
  tags: ['outdoor', 'cursed', 'uneven'],
  tier: 1,
  description: 'A cursed fighting pit dug around the roots of a hanging tree.',
  size: 'cramped',
  zoneDef: { Corner: -4 },
  surfaceMod: { initiativeMod: -2, riposteMod: 0, enduranceMult: 1.1 },
};

/**
 * Tiny, brutal ring with uneven stones. Penalizes lunging and favors close-quarters brawling.
 */
export const BRASS_RING: ArenaConfig = {
  id: 'brass_ring',
  name: 'The Brass Ring',
  tags: ['outdoor', 'cramped', 'uneven'],
  tier: 1,
  size: 'cramped',
  description:
    'A tiny, brutal ring with uneven stones that penalize lunging and favor close-quarters brawling.',
  zoneDef: { Edge: -3, Corner: -5 },
  surfaceMod: { initiativeMod: -2, enduranceMult: 1.1, riposteMod: 1 },
  startingZone: 'Center',
};

/**
 * Dizzying elevated span where low endurance fighters struggle and long weapons are useless.
 */
export const NARROW_BRIDGE: ArenaConfig = {
  id: 'narrow_bridge',
  name: 'The Narrow Bridge',
  tags: ['outdoor', 'cramped', 'elevated'],
  tier: 2,
  size: 'cramped',
  description:
    'A dizzying span where low endurance fighters struggle to breathe and long weapons are useless.',
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
