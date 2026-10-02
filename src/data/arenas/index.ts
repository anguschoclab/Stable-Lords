// data/arenas — arena registry, venue data, and lore.
// Barrel preserves the original '@/data/arenas' surface.
export * from './registry';
export * from './venues/seed';
export * from './venues/variants';
export * from './venues/late';
export * from './lore';

import { registerArena, snapshotRegistry, restoreRegistry, setDefaultArena } from './registry';
import {
  STANDARD_ARENA,
  MIST_SHROUDED_RUINS,
  THE_GALLOWS_TREE,
  BRASS_RING,
  NARROW_BRIDGE,
  MUDPIT_ARENA,
  BLOODSANDS_ARENA,
  UNDERPIT_ARENA,
  HIGHPLAIN_ARENA,
  LANTERN_HALL_ARENA,
  WALLED_COURT_ARENA,
  CLIFFTOP_ARENA,
  FLOODED_VAULT_ARENA,
} from './venues/seed';
import {
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
  THE_MEAT_GRINDER,
  JUNGLE_RUINS,
  THE_ABYSSAL_PIT,
  THE_SUNKEN_VAULT,
  IRON_FORGE,
} from './venues/variants';
import {
  THE_BRAMBLE_RING,
  THUNDER_PEAK,
  SUN_BAKED_PLATEAU,
  ANCIENT_AQUEDUCT,
  FORGOTTEN_CRYPT,
  RUSTED_GORGE,
  THE_ASYLUM,
  VOLCANIC_CRATER,
  THE_WAILING_CHASM,
  SHATTERED_MONOLITH,
  VERDANT_LABYRINTH,
  THE_SHIFTING_SANDS,
  THE_CURSED_SWAMP,
  THE_JAGGED_PEAK,
  THE_MURKY_DEPTHS,
  THE_SMOLDERING_PITS,
  THE_CRYSTAL_SPIRE,
  THE_IRON_CAGE,
  THE_FROZEN_LAKE,
  THE_ACID_BOG,
} from './venues/late';

// ─── Auto-register ────────────────────────────────────────────────────────────
// Registration order is observable: getAllArenas() iterates in insert order and
// seeded sims map RNG draws onto that order. Keep it identical to the pre-split
// arenas.ts array order — do not regroup by venue shard.
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
  THE_MEAT_GRINDER,
  THE_ABYSSAL_PIT,
  JUNGLE_RUINS,
  THE_BRAMBLE_RING,
  THUNDER_PEAK,
  SUN_BAKED_PLATEAU,
  ANCIENT_AQUEDUCT,
  THE_SUNKEN_VAULT,
  IRON_FORGE,
  MIST_SHROUDED_RUINS,
  THE_GALLOWS_TREE,
  FORGOTTEN_CRYPT,
  RUSTED_GORGE,
  THE_ASYLUM,
  VOLCANIC_CRATER,
  THE_WAILING_CHASM,
  SHATTERED_MONOLITH,
  VERDANT_LABYRINTH,
  THE_SHIFTING_SANDS,
  THE_CURSED_SWAMP,
  THE_JAGGED_PEAK,
  THE_MURKY_DEPTHS,
  THE_SMOLDERING_PITS,
  THE_CRYSTAL_SPIRE,
  THE_IRON_CAGE,
  THE_FROZEN_LAKE,
  THE_ACID_BOG,
].forEach(registerArena);

setDefaultArena(STANDARD_ARENA);

// Test-only reset: restore the registry to the built-in set so test
// registerArena() calls do not leak into other tests sharing a worker.
const BUILTIN_ARENAS = snapshotRegistry();

/** Restore the arena registry to its built-in snapshot (test-only). */
export function resetArenaRegistry(): void {
  restoreRegistry(BUILTIN_ARENAS);
}
