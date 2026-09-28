import { describe, it, expect } from 'vitest';
import {
  registerArena,
  getArenaById,
  getAllArenas,
  getArenasByTag,
  getArenasByTier,
  arenaTagSet,
  STANDARD_ARENA,
} from '@/data/arenas';
import type { ArenaConfig } from '@/types/shared.types';

describe('Arena Registry', () => {
  it('getArenaById returns STANDARD_ARENA for unknown id', () => {
    expect(getArenaById('nonexistent_arena')).toBe(STANDARD_ARENA);
  });

  it('getArenaById returns the registered arena', () => {
    expect(getArenaById('standard_arena')).toBe(STANDARD_ARENA);
  });

  it('getAllArenas includes standard_arena', () => {
    const all = getAllArenas();
    expect(all.some((a) => a.id === 'standard_arena')).toBe(true);
  });

  it('getArenasByTag returns only arenas with that tag', () => {
    const outdoor = getArenasByTag('outdoor');
    expect(outdoor.every((a) => a.tags.includes('outdoor'))).toBe(true);
  });

  it('getArenasByTier returns only arenas of that tier', () => {
    const tier1 = getArenasByTier(1);
    expect(tier1.every((a) => a.tier === 1)).toBe(true);
  });

  it('registerArena adds to the registry', () => {
    const custom: ArenaConfig = {
      id: 'test_arena',
      name: 'Test Arena',
      tags: ['indoor'],
      tier: 1,
      size: 'standard',
      description: 'A test arena',
      zoneDef: { Edge: -2, Corner: -4 },
      surfaceMod: { initiativeMod: 0, enduranceMult: 1.0, riposteMod: 0 },
    };
    registerArena(custom);
    expect(getArenaById('test_arena')).toEqual(custom);
  });

  it('getAllArenas enumerates built-ins in the pinned legacy registration order', () => {
    // Registration order is observable: seeded sims index RNG draws into this
    // order. The arenas.ts -> data/arenas/ split accidentally regrouped it once
    // and shifted the entire seeded trajectory — pinned here so it can't recur.
    expect(getAllArenas().map((a) => a.id)).toEqual([
      'standard_arena',
      'mudpit_arena',
      'bloodsands_arena',
      'underpit_arena',
      'highplain_arena',
      'lantern_hall_arena',
      'walled_court_arena',
      'clifftop_arena',
      'flooded_vault_arena',
      'sundered_coliseum',
      'sunken_temple',
      'crystal_cavern',
      'whispering_grove',
      'charnel_pits',
      'flesh_gardens',
      'gutter_pit',
      'stormtop_terrace',
      'glacial_rift',
      'sky_platform',
      'misty_valley',
      'brass_ring',
      'narrow_bridge',
      'the_meat_grinder',
      'the_abyssal_pit',
      'jungle_ruins',
      'the_bramble_ring',
      'thunder_peak',
      'sun_baked_plateau',
      'ancient_aqueduct',
      'the_sunken_vault',
      'iron_forge',
      'mist_shrouded_ruins',
      'the_gallows_tree',
      'forgotten_crypt',
      'rusted_gorge',
      'the_asylum',
      'volcanic_crater',
      'the_wailing_chasm',
      'shattered_monolith',
      'verdant_labyrinth',
      'the_shifting_sands',
      'the_cursed_swamp',
      'the_jagged_peak',
      'the_murky_depths',
      'the_smoldering_pits',
      'the_crystal_spire',
      'the_iron_cage',
    ]);
  });

  it('arenaTagSet returns a memoized Set matching arena.tags', () => {
    const arena = getArenaById('standard_arena');
    const s1 = arenaTagSet(arena);
    const s2 = arenaTagSet(arena);
    expect(s1).toBe(s2); // same memoized instance
    expect([...s1].sort()).toEqual([...arena.tags].sort());
  });
});
