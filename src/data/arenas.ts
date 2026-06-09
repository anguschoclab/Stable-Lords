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
export const ARENA_LORE: ArenaLoreEntry[] = [
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
].forEach(registerArena);
