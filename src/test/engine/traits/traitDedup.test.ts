/**
 * Trait deduplication tests — verifies removed traits no longer exist,
 * retained traits are intact, iron_vein enduranceMult is fixed, and
 * no duplicate effects remain in the generic positive pool.
 */
import { describe, it, expect } from 'vitest';
import { getStaticTraitMods } from '@/engine/traits';
import { conflictsWith } from '@/engine/training/trainingGains/traitTraining';
import { TRAITS, generateTraits } from '@/engine/traits';
import { SeededRNG } from '@/utils/random';

const REMOVED_IDS = [
  'shadow_born',
  'feral_instincts',
  'iron_gut',
  'blood_scent',
  'pit_rat',
  'pit_born',
  'gutter_snipe',
  'orphan_rage',
  'survivalist',
  'perceptive',
  'armor_chink',
  'wild',
] as const;

const RETAINED_IDS = [
  'feral_instinct',
  'gutter_blood',
  'quick',
  'ironlung',
  'agile',
  'berserker',
  'cornered_beast',
  'precise',
  'cold_eyed',
  'called_shot',
  'hesitant',
  'iron_vein',
  'asylum_born',
  'street_scrapper',
  'gutter_cunning',
  'street_rat_cunning',
] as const;

const BASELINE_COUNT = 100;
const EXPECTED_COUNT = 179; // 165 + 10 V17 curated traits + 3 new narrative traits

/** Canonical effect signature: key-order must not change the hash
 *  (JSON.stringify of an object literal preserves insertion order, so a
 *  reordered effect would otherwise false-positive/negative the dupe scan). */
const effectHash = (effect: any) => {
  const { fightPlanMod, ...core } = effect;
  return JSON.stringify(core, Object.keys(core).sort());
};

describe('Trait deduplication', () => {
  describe('removed traits no longer exist', () => {
    for (const id of REMOVED_IDS) {
      it(`${id} is undefined in TRAITS`, () => {
        expect(TRAITS[id]).toBeUndefined();
      });
    }
  });

  describe('retained traits still exist', () => {
    for (const id of RETAINED_IDS) {
      it(`${id} is defined in TRAITS`, () => {
        expect(TRAITS[id]).toBeDefined();
      });
    }
  });

  describe('union traits exist', () => {
    for (const id of [
      'orphan_street_rat',
      'orphan_pit_fighter',
      'orphan_survivor',
      'iron_orphan',
    ]) {
      it(`${id} is defined in TRAITS`, () => {
        expect(TRAITS[id]).toBeDefined();
      });
    }
  });

  describe('V10 trait: orphan_scavenger (PR #1020)', () => {
    it('is defined in TRAITS', () => {
      expect(TRAITS.orphan_scavenger).toBeDefined();
    });

    it('has the curated effect shape and Notable/positive placement', () => {
      const t = TRAITS.orphan_scavenger!;
      expect(t.effect).toEqual({ enduranceMult: 0.96, iniModFresh: 1 });
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
    });

    it('does not collide on effect with orphan_survivor', () => {
      const a = TRAITS.orphan_scavenger?.effect;
      const b = TRAITS.orphan_survivor?.effect;
      const stable = (e: any) => JSON.stringify(e, Object.keys(e ?? {}).sort());
      expect(stable(a)).not.toBe(stable(b));
    });
  });

  describe('iron_vein enduranceMult is fixed', () => {
    it('enduranceMult is 0.9 (buff, not 1.1 debuff)', () => {
      expect(TRAITS.iron_vein?.effect.enduranceMult).toBeCloseTo(0.9);
      expect(TRAITS.iron_vein?.effect.enduranceMult).not.toBe(1.1);
    });

    it('getStaticTraitMods returns enduranceMult ~0.9 for iron_vein', () => {
      const mods = getStaticTraitMods({ traits: ['iron_vein'] } as any);
      expect(mods.enduranceMult).toBeCloseTo(0.9);
    });
  });

  describe('iron_knuckles disarm effects are real', () => {
    it('carries disarmResist and unarmedDmgBonus — matching its description', () => {
      expect(TRAITS.iron_knuckles?.effect.disarmResist).toBeCloseTo(0.4);
      expect(TRAITS.iron_knuckles?.effect.unarmedDmgBonus).toBe(2);
    });

    it('getStaticTraitMods surfaces both for an iron_knuckles warrior', () => {
      const mods = getStaticTraitMods({ traits: ['iron_knuckles'] } as any);
      expect(mods.disarmResist).toBeCloseTo(0.4);
      expect(mods.unarmedDmgBonus).toBe(2);
    });
  });

  describe('no duplicate effects in generic positive Common/Notable pool', () => {
    it('no two generic positive Common/Notable traits share the same core effect', () => {
      const generic = Object.values(TRAITS).filter(
        (t) => t.sign === 'positive' && !t.styles && (t.tier === 'Common' || t.tier === 'Notable')
      );

      const seen = new Map<string, string>();
      for (const t of generic) {
        const hash = effectHash(t.effect);
        if (seen.has(hash)) {
          throw new Error(`Duplicate effect between "${seen.get(hash)}" and "${t.id}": ${hash}`);
        }
        seen.set(hash, t.id);
      }

      expect(seen.size).toBe(generic.length);
    });

    it('effectHash is key-order insensitive (follow-up)', () => {
      expect(effectHash({ enduranceMult: 0.96, iniModFresh: 1 })).toBe(
        effectHash({ iniModFresh: 1, enduranceMult: 0.96 })
      );
      expect(effectHash({ a: 1, fightPlanMod: { x: 1 }, b: 2 })).toBe(effectHash({ b: 2, a: 1 }));
    });
  });

  describe('generateTraits still produces valid results', () => {
    it('all generated traits resolve in TRAITS', () => {
      const rng = new SeededRNG(12345);
      for (let i = 0; i < 1000; i++) {
        const traits = generateTraits(rng, 'brutal');
        for (const id of traits) {
          expect(TRAITS[id]).toBeDefined();
        }
      }
    });

    it('still produces varied traits (>= 6 distinct)', () => {
      const rng = new SeededRNG(54321);
      const seen = new Set<string>();
      for (let i = 0; i < 2000; i++) {
        for (const id of generateTraits(rng, 'brutal')) seen.add(id);
      }
      expect(seen.size).toBeGreaterThanOrEqual(6);
    });
  });

  describe('generateTraits never produces removed traits', () => {
    it('no removed trait ID appears in 1000 generations', () => {
      const rng = new SeededRNG(99999);
      const removedSet = new Set<string>(REMOVED_IDS as readonly string[]);
      for (let i = 0; i < 1000; i++) {
        const traits = generateTraits(rng);
        for (const id of traits) {
          expect(removedSet.has(id)).toBe(false);
        }
      }
    });
  });

  describe('trait count matches expected baseline', () => {
    it(`TRAITS has ${EXPECTED_COUNT} entries (baseline ${BASELINE_COUNT} + 20 new)`, () => {
      expect(Object.keys(TRAITS).length).toBe(EXPECTED_COUNT);
    });
  });

  describe('new traits from narrative-content-expansion', () => {
    it('orphan_vengeance is defined with correct effect fields', () => {
      expect(TRAITS.orphan_vengeance).toBeDefined();
      expect(TRAITS.orphan_vengeance?.effect.attModLate).toBe(2);
      // killWindowBonus lives on the probability scale — the old `1` saturated
      // the 0.04 kill cap on its own; rescaled to 0.01 (see killWindowScale test).
      expect(TRAITS.orphan_vengeance?.effect.killWindowBonus).toBe(0.01);
      expect(TRAITS.orphan_vengeance?.tier).toBe('Exceptional');
      expect(TRAITS.orphan_vengeance?.sign).toBe('positive');
    });

    it('orphan_fragility is defined with correct effect fields', () => {
      expect(TRAITS.orphan_fragility).toBeDefined();
      expect(TRAITS.orphan_fragility?.effect.defModEarly).toBe(-1);
      expect(TRAITS.orphan_fragility?.effect.enduranceMult).toBeCloseTo(0.9);
      expect(TRAITS.orphan_fragility?.tier).toBe('Flaw');
      expect(TRAITS.orphan_fragility?.sign).toBe('negative');
    });

    it('orphan_vengeance and orphan_fragility are not in REMOVED_IDS', () => {
      expect(REMOVED_IDS).not.toContain('orphan_vengeance');
      expect(REMOVED_IDS).not.toContain('orphan_fragility');
    });
  });

  describe('V17 curated traits (PRs #1056/#1057/#1060/#1064)', () => {
    const CASES: [string, Record<string, unknown>][] = [
      ['orphan_shadow_fighter', { killWindowBonus: 0.008, iniModEarly: 1 }],
      ['orphan_shadow_stalker', { defModEarly: 1, attModLate: 1 }],
      ['gutter_blade_dancer', { defModLate: 1, dmgBonus: 1 }],
      ['blind_spot_mapper', { defModEarly: 1, iniModEarly: 1, decMod: 1 }],
      ['serene_psychopath', { decMod: 1, defModLate: 1, enduranceMult: 0.95 }],
      ['ice_numbed', { defModLowHp: 2, parModHighHp: 1 }],
      ['armor_cracker', { attMod: 1, dmgBonus: 1 }],
      ['jagged_claws', { dmgBonus: 1, iniMod: 1 }],
      ['orphan_blood_bound', { attModLowHp: 3, defModLowHp: -2 }],
      ['ash_choked_fury', { dmgBonus: 1, defMod: 1 }],
    ];

    for (const [id, effect] of CASES) {
      it(`${id} is defined as Notable/positive with its curated core effect`, () => {
        const t = TRAITS[id];
        expect(t, `${id} missing from TRAITS`).toBeDefined();
        expect(t!.tier).toBe('Notable');
        expect(t!.sign).toBe('positive');
        for (const [k, v] of Object.entries(effect)) {
          expect((t!.effect as Record<string, unknown>)[k]).toBe(v);
        }
      });
    }
  });

  describe('no orphan references in CONFLICT_GROUPS', () => {
    it('removed trait IDs do not appear in any conflict group', () => {
      // If a removed ID were in a conflict group, conflictsWith would return
      // true when paired with another member of that group. We check that
      // conflictsWith(removedId, [allOtherRemovedIds]) is false for each.
      for (const id of REMOVED_IDS) {
        const others = REMOVED_IDS.filter((o) => o !== id);
        expect(conflictsWith(id, [...others])).toBe(false);
      }
    });
  });
});
