import { describe, it, expect } from 'vitest';
import { getArenaById, getAllArenas, ARENA_LORE } from '@/data/arenas';

describe('arena registration — V7 union (PR #988 arenas + PR #984/#991/#995 lore)', () => {
  it.each([
    'the_jagged_peak',
    'the_murky_depths',
    'the_smoldering_pits',
    'the_crystal_spire',
  ])('arena %s is registered', (id) => {
    const arena = getArenaById(id);
    expect(arena.id).toBe(id);
  });

  it('getAllArenas includes all four new arenas', () => {
    const ids = new Set(getAllArenas().map((a) => a.id));
    for (const id of [
      'the_jagged_peak',
      'the_murky_depths',
      'the_smoldering_pits',
      'the_crystal_spire',
    ]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it.each([
    'iron_cage_the_blood_bars',
    'cursed_swamp_the_drowning_grasp',
    'the_gallows_tree_hangman_dance',
    'standard_arena_blood_stain',
    'mist_shrouded_ruins_phantom_cheers',
    'rusted_gorge_madmans_end',
  ])('ARENA_LORE gains union entry %s', (id) => {
    expect(ARENA_LORE.some((e) => e.id === id)).toBe(true);
  });

  it.each([
    'grand_colosseum_emperors_folly',
    'subterranean_pits_the_cave_in',
    'blood_sands_crimson_tide',
  ])('ARENA_LORE rejects %s — references a non-existent arena', (id) => {
    expect(ARENA_LORE.some((e) => e.id === id)).toBe(false);
  });
});
