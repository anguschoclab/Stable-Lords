import { describe, it, expect } from 'vitest';
import { ORIGINS } from '@/engine/narrative/lore/origins';
import { CHILDHOOD_TRAITS } from '@/engine/narrative/lore/childhoodTraits';
import { DEFINING_MOMENTS } from '@/engine/narrative/lore/definingMoments';
import { ARENA_LORE } from '@/data/arenas/lore';
import { ARENA_LORE_BACKFILL_2 } from '@/data/arenas/loreBackfill2';

/**
 * V21 narrative-pool guards (PRs #1070/#1071/#1073/#1075/#1077 union-merge).
 *
 * The uniqueness describes are live ratchets — green at commit and must stay
 * green through the union merges (an intra-pool duplicate or a cross-pool
 * arena-lore id collision fails here). The MEGAPLAN-V7 describes pin the
 * post-merge union contents and counts — RED until all five branches land;
 * counts are the pre-fuzzy-dedupe union totals and are reconciled at the
 * final merge commit.
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

  it('ARENA_LORE ids are unique (catches local + backfill collisions)', () => {
    // lore.ts spreads ARENA_LORE_BACKFILL_1/2 into ARENA_LORE — a single
    // uniqueness assert on the exported pool covers local-local,
    // local-backfill, and backfill-backfill id collisions.
    const ids = ARENA_LORE.map((e) => e.id);
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const id of ids) {
      if (seen.has(id)) dupes.push(id);
      seen.add(id);
    }
    expect(dupes).toEqual([]);
  });
});

describe('MEGAPLAN-V7: V21 union-merged lore pools', () => {
  it('origins contains the union of all five branch entries (MEGAPLAN-V7)', () => {
    for (const s of [
      // #1075 add-new-narrative-content
      'Abandoned during the frenzied evacuation of the Lower Docks, left with nothing but a rusted spoon',
      // #1070 expand-narrative-lore-pools
      'Tossed into the corpse carts during the Red Fever, only to crawl back out days later',
      // #1071 feat/expand-narrative-pool
      'Discovered starving in the hollowed-out skull of a forgotten leviathan in the Deep Wastes',
      // #1073 feat/narrative-expansion
      'Raised in the bleak, dripping cells of the Iron Spire Orphanage',
      // #1077 feature/lore-content-expansion
      'Raised by the grim overseers of the Blackspire Orphanage, where weakness was punished with starvation',
    ]) {
      expect(ORIGINS).toContain(s);
    }
    expect(ORIGINS.length).toBe(411); // 387 V20 union + 4 + 5 + 5 + 5 + 5
  });

  it('childhoodTraits contains the union of all five branch entries (MEGAPLAN-V7)', () => {
    expect(CHILDHOOD_TRAITS.length).toBe(245); // 228 + 3 + 3 + 5 + 3 + 3
  });

  it('definingMoments contains the union of all five branch entries (MEGAPLAN-V7)', () => {
    expect(DEFINING_MOMENTS.length).toBe(223); // 205 + 4 + 3 + 5 + 3 + 3
  });

  it('loreBackfill2 contains the V21 backfill ids (MEGAPLAN-V7)', () => {
    const ids = new Set(ARENA_LORE_BACKFILL_2.map((e) => e.id));
    for (const id of [
      // #1075
      'mudpit_arena_drowned_brawl',
      'walled_court_arena_iron_maiden',
      'standard_arena_blind_butcher',
      // #1073
      'charnel_pits_the_blood_tide',
      'lantern_hall_arena_falling_shadows',
      // #1077
      'charnel_pits_flesh_rot_outbreak',
      'walled_court_arena_shattered_balcony',
    ]) {
      expect(ids.has(id), `${id} missing`).toBe(true);
    }
    expect(ARENA_LORE_BACKFILL_2.length).toBe(35); // 28 + 3 (#1075) + 2 (#1073) + 2 (#1077)
  });

  it('ARENA_LORE contains the V21 main-pool ids (MEGAPLAN-V7)', () => {
    const ids = new Set(ARENA_LORE.map((e) => e.id));
    for (const id of [
      // #1070
      'standard_arena_the_great_collapse',
      'mudpit_arena_blind_butcher',
      // #1071
      'sun_baked_plateau_the_glass_scorch',
      'ancient_aqueduct_drowning_echoes',
      'sun_baked_plateau_bleached_bones',
    ]) {
      expect(ids.has(id), `${id} missing`).toBe(true);
    }
    // 230 total (125 local + 77 bf1 + 28 bf2 spreads) + 5 local adds
    // (#1070 ×2, #1071 ×3) + 7 bf2 adds (#1075 ×3, #1073 ×2, #1077 ×2)
    expect(ARENA_LORE.length).toBe(242);
  });
});
