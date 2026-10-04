/**
 * Warrior Factory - Creates warriors with calculated stats and favorites
 * Extracted from factories.ts to follow SRP
 */
import type { Warrior } from '@/types/state.types';
import { FightingStyle, type WarriorId } from '@/types/shared.types';
import { computeWarriorStats, rollLuckfactor } from '@/engine/warrior/skillCalc';
import { generateFavorites } from '@/engine/favorites';
import { generateTraits } from '@/engine/traits';
import { STYLE_ARCHETYPE } from '@/engine/factories/statGeneration';
import { getFittedLoadout } from '@/engine/equipment/loadoutFitting';
import { generateId } from '@/utils/idUtils';
import { entropyRng } from '@/utils/random';
import type { IRNGService } from '@/engine/core/rng/IRNGService';

/**
 *
 */
export interface MakeWarriorArgs {
  id: WarriorId | undefined;
  name: string;
  style: FightingStyle;
  attrs: { ST: number; CN: number; SZ: number; WT: number; WL: number; SP: number; DF: number };
  overrides?: Partial<Warrior>;
  rng?: IRNGService;
}

/**
 * Creates a new warrior with calculated stats and favorites.
 *
 * @param args.id - Optional ID (if not provided, one will be generated)
 * @param args.name - Warrior name
 * @param args.style - Fighting style
 * @param args.attrs - Base attributes
 * @param args.overrides - Partial warrior properties to override defaults
 * @param args.rng - Optional SeededRNG for deterministic generation
 */
export function makeWarrior(args: MakeWarriorArgs): Warrior {
  const { id, name, style, attrs, overrides } = args;
  const { rng } = args;
  const { baseSkills, derivedStats } = computeWarriorStats(attrs, style);
  const favorites = generateFavorites(style, rng ?? entropyRng());
  // Traits are now consumed in combat (see src/engine/traits.ts) — generate
  // them at creation so warriors carry inherent quirks. Tests/explicit
  // overrides win via the spread below.
  const traits = overrides?.traits ?? (rng ? generateTraits(rng, STYLE_ARCHETYPE[style]) : []);
  const trainability = overrides?.trainability ?? (rng ? 0.4 + rng.next() * 0.5 : 0.65);
  // Seed equipment with the style's classic loadout, weapon fitted to this
  // warrior's attributes: the favorite when they meet its canonical stat
  // requirements, otherwise the best weapon the style allows that they can
  // actually wield (an unusable favorite costs −2 ATT per missing point).
  const equipment = overrides?.equipment ?? getFittedLoadout(style, attrs);

  return {
    id: id ?? (rng ? (rng.uuid() as WarriorId) : (generateId(undefined, 'warrior') as WarriorId)),
    name,
    style,
    attributes: attrs,
    baseSkills,
    // Hidden ±4-per-skill luckfactor (canonical) — only rolled for seeded/real-game
    // warriors; rng-less test builds stay luck-neutral.
    luckfactor: rng ? rollLuckfactor(rng) : undefined,
    derivedStats,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 0, losses: 0, kills: 0 },
    champion: false,
    status: 'Active',
    age: 18 + Math.floor((rng ? rng.next() : 0.5) * 8),
    favorites,
    traits,
    trainability,
    equipment,
    lore: overrides?.lore ?? '',
    origin: overrides?.origin ?? '',
    ...overrides,
  };
}
