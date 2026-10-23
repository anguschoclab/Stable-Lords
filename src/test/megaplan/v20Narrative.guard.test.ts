import { describe, it, expect } from 'vitest';
import { ORIGINS } from '@/engine/narrative/lore/origins';
import { CHILDHOOD_TRAITS } from '@/engine/narrative/lore/childhoodTraits';
import { DEFINING_MOMENTS } from '@/engine/narrative/lore/definingMoments';
import { ARENA_LORE_BACKFILL_2 } from '@/data/arenas/loreBackfill2';

/**
 * V20 narrative-pool guards (PRs #1065 + #1068 union-merge).
 *
 * The uniqueness describes are live ratchets — green at commit and must
 * stay green through the union-merge (a union merge that reintroduces an
 * intra-pool duplicate fails here). The MEGAPLAN-V6 .skip specs pin the
 * post-merge content sets and un-skip once both branches land.
 */
describe('narrative pool uniqueness (live guard)', () => {
  const pools: [string, string[]][] = [
    ['ORIGINS', ORIGINS],
    ['CHILDHOOD_TRAITS', CHILDHOOD_TRAITS],
    ['DEFINING_MOMENTS', DEFINING_MOMENTS],
  ];

  for (const [name, pool] of pools) {
    it(`${name} contains no duplicate strings`, () => {
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const s of pool) {
        if (seen.has(s)) dupes.push(s.slice(0, 60));
        seen.add(s);
      }
      expect(dupes).toEqual([]);
    });
  }

  it('ARENA_LORE_BACKFILL_2 contains no duplicate ids', () => {
    const ids = ARENA_LORE_BACKFILL_2.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('MEGAPLAN-V6: V20 union-merged lore pools', () => {
  it.skip('origins contains the union of #1065 + #1068 entries (MEGAPLAN-V6)', () => {
    for (const s of [
      'Raised by silent sentinels in the crumbling towers of the Ashen Convent',
      'Found shivering in the rusted ventilation shafts of the Iron Convent',
    ]) {
      expect(ORIGINS).toContain(s);
    }
    expect(ORIGINS.length).toBe(387); // 373 baseline + 8 (#1065) + 6 (#1068)
  });

  it.skip('childhoodTraits contains the union of #1065 + #1068 entries (MEGAPLAN-V6)', () => {
    for (const s of [
      'learned to feign unconsciousness under a pile of corpses to survive the winter cullings',
      'learned to map out an entire brawl in their head before throwing the first punch',
    ]) {
      expect(CHILDHOOD_TRAITS).toContain(s);
    }
    expect(CHILDHOOD_TRAITS.length).toBe(226); // 217 + 5 (#1065) + 4 (#1068)
  });

  it.skip('definingMoments contains the union of #1065 + #1068 entries (MEGAPLAN-V6)', () => {
    for (const s of [
      'until they locked eyes with a dying champion and understood that glory was just another word for survival',
      'until they fought off three armed thugs with nothing but a rusted chain, claiming it as their birthright',
    ]) {
      expect(DEFINING_MOMENTS).toContain(s);
    }
    expect(DEFINING_MOMENTS.length).toBe(205); // 196 + 5 (#1065) + 4 (#1068)
  });

  it.skip('loreBackfill2 contains all six V20 arena lore ids (MEGAPLAN-V6)', () => {
    const ids = new Set(ARENA_LORE_BACKFILL_2.map((e) => e.id));
    for (const id of [
      'standard_arena_blood_soaked_sands',
      'mudpit_arena_sunken_colossus',
      'lantern_hall_arena_extinguished_flame',
      'charnel_pits_bone_splinters',
      'lantern_hall_arena_shadow_duel',
      'walled_court_arena_blood_gutter',
    ]) {
      expect(ids.has(id), `${id} missing`).toBe(true);
    }
    expect(ARENA_LORE_BACKFILL_2.length).toBe(28); // 22 + 3 (#1065) + 3 (#1068)
  });
});
