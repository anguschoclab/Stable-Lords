import { describe, it, expect } from 'vitest';
import { ORIGINS } from '@/engine/narrative/lore/origins';
import { CHILDHOOD_TRAITS } from '@/engine/narrative/lore/childhoodTraits';
import { DEFINING_MOMENTS } from '@/engine/narrative/lore/definingMoments';
import { ARENA_LORE } from '@/data/arenas/lore';
import { ARENA_LORE_BACKFILL_2 } from '@/data/arenas/loreBackfill2';
import killText from '@/data/narrative/combatKillText.json';
import pbp from '@/data/narrative/combatPbp.json';
import strikes from '@/data/narrative/combatStrikes.json';
import uiMeta from '@/data/narrative/uiMeta.json';

/**
 * V29 narrative-pool guards (PRs #1079/#1082/#1085 lore-union +
 * #1080/#1083/#1089/#1093 combat-JSON union).
 *
 * The uniqueness describes are live ratchets — an intra-pool duplicate or a
 * duplicate string inside any combat-JSON pool fails here. The MEGAPLAN-V29
 * describes pin the post-merge union contents: every signature entry from
 * each source PR, the exact lore counts reconciled at extraction time, and
 * exactly-once semantics for the cross-PR duplicated JSON entries.
 *
 * Expected union (verified against branch diffs vs origin/main):
 *   ORIGINS 411+15=426 · CHILDHOOD_TRAITS 245+9=254 ·
 *   DEFINING_MOMENTS 223+9=232 · ARENA_LORE 242+6=248 · BACKFILL_2 35 (untouched)
 */

/** Collects every string value in a nested JSON tree. */
function collectStrings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') {
    out.push(node);
  } else if (Array.isArray(node)) {
    for (const v of node) collectStrings(v, out);
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node as Record<string, unknown>)) collectStrings(v, out);
  }
  return out;
}

describe('combat JSON pool uniqueness (live guard)', () => {
  // Pre-existing shared labels (verified on main at V29 Phase-3 authoring):
  // 'SOLAR PLEXUS' is a body-part key reused across two pbp sections;
  // 'Fallen in combat.' is status copy reused across two uiMeta keys.
  // The ratchet forbids NEW duplicates — the V29 union merge must dedupe.
  const ALLOWED_SHARED: Record<string, Set<string>> = {
    combatKillText: new Set(),
    combatPbp: new Set(['SOLAR PLEXUS']),
    combatStrikes: new Set(),
    uiMeta: new Set(['Fallen in combat.']),
  };
  const pools: [string, unknown][] = [
    ['combatKillText', killText],
    ['combatPbp', pbp],
    ['combatStrikes', strikes],
    ['uiMeta', uiMeta],
  ];

  for (const [name, pool] of pools) {
    it(`${name} contains no duplicate string values beyond the allowlisted shared labels`, () => {
      const seen = new Set<string>();
      const dupes: string[] = [];
      for (const s of collectStrings(pool)) {
        if (seen.has(s) && !ALLOWED_SHARED[name].has(s)) dupes.push(s.slice(0, 60));
        seen.add(s);
      }
      expect(dupes).toEqual([]);
    });
  }
});

describe('MEGAPLAN-V29: union-merged lore pools', () => {
  it('origins contains the union of all three branch entries (MEGAPLAN-V29)', () => {
    for (const s of [
      // #1079 chore/add-narrative-entries
      'Raised in the crumbling ruins of the Hollow Hand Orphanage, surviving on rain and rats',
      'Left on the obsidian altar of a forgotten cult before being claimed by the pit masters',
      // #1082 feat/expand-narrative-content
      'Raised by the grim overseers of the Hollowstone Orphanage, learning to fight for scraps',
      'Left shivering in a rusted crate behind the Slaughterhouse of the Ash Dunes',
      // #1085 feature/narrative-content-expansion
      'Endured the silent, lightless punishments in the oubliettes of the Weeping Mother Orphanage',
      'Abandoned in the rusted cog-works of the Lower District, surviving on grease and scraped bone',
    ]) {
      expect(ORIGINS).toContain(s);
    }
    expect(ORIGINS.length).toBe(426); // 411 + 5 + 5 + 5
  });

  it('childhoodTraits contains the V29 union additions (MEGAPLAN-V29)', () => {
    expect(CHILDHOOD_TRAITS.length).toBe(254); // 245 + 3 + 3 + 3
  });

  it('definingMoments contains the V29 union additions (MEGAPLAN-V29)', () => {
    expect(DEFINING_MOMENTS.length).toBe(232); // 223 + 3 + 3 + 3
  });

  it('ARENA_LORE contains the V29 main-pool ids (MEGAPLAN-V29)', () => {
    const ids = new Set(ARENA_LORE.map((e) => e.id));
    for (const id of [
      // #1079
      'charnel_pits_the_hollow_chorus',
      'sunken_temple_drowned_idol',
      // #1082
      'mudpit_arena_choking_trench',
      'standard_arena_the_shattered_shields',
      // #1085
      'charnel_pits_bone_splinter_massacre',
      'mudpit_arena_smothered_cry',
    ]) {
      expect(ids.has(id), `${id} missing`).toBe(true);
    }
    expect(ARENA_LORE.length).toBe(248); // 242 + 2 + 2 + 2
  });

  it('loreBackfill2 is untouched by V29 (invariant)', () => {
    expect(ARENA_LORE_BACKFILL_2.length).toBe(35);
  });
});

describe('MEGAPLAN-V29: union-merged combat JSON pools', () => {
  it('cross-PR duplicated killText entries land exactly once', () => {
    const strings = collectStrings(killText);
    for (const shared of [
      // added identically by #1080, #1083, #1089 AND #1093 — union keeps one
      '{{attacker}} aims to slay {{defender}}!',
    ]) {
      expect(strings.filter((s) => s === shared)).toHaveLength(1);
    }
  });

  it('per-PR killText additions survive the union', () => {
    const strings = collectStrings(killText);
    for (const s of [
      // #1083
      '{{attacker}} has murder in their eyes!',
      // #1093
      "{{attacker}} shows no mercy, intent on a lethal strike!",
    ]) {
      expect(strings).toContain(s);
    }
  });

  it('combatStrikes keeps the #1080 additions', () => {
    const strings = collectStrings(strikes);
    expect(strings).toContain(
      'The blade grazes {{defender}}, leaving only a superficial scratch.'
    );
  });

  it('uiMeta keeps the shared "Flashy" entry exactly once', () => {
    // #1089 and #1093 both add this key verbatim — union keeps one
    const meta = uiMeta as Record<string, string>;
    expect(meta['Flashy']).toBe('Crowd favorite — earns +2 Popularity per flashy fight.');
  });
});
