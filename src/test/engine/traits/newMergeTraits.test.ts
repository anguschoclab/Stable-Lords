/**
 * New merge traits — verifies 9 new traits from lore expansion branches
 * are registered, well-formed, and have valid archetypes.
 * Pre-merge test: will FAIL on main (traits don't exist yet).
 */
import { describe, it, expect } from 'vitest';
import { TRAITS } from '@/engine/traits';

const VALID_TIERS = ['Common', 'Notable', 'Exceptional', 'Signature'] as const;
const VALID_ARCHETYPES = ['brutal', 'agile', 'cunning', 'tank'] as const;

const NEW_TRAIT_IDS = [
  'grim_orphan',
  'iron_will',
  'orphan_scars',
  'gutter_instinct',
  'blood_forged',
  'silent_killer',
  'primal_instinct',
  'born_in_blood',
  'chaos_touched',
] as const;

describe('new merge traits', () => {
  describe('all new traits are registered', () => {
    for (const id of NEW_TRAIT_IDS) {
      it(`${id} is defined in TRAITS`, () => {
        expect(TRAITS[id as keyof typeof TRAITS]).toBeDefined();
      });
    }
  });

  describe('feral_instinct_v2 was renamed to primal_instinct', () => {
    it('feral_instinct_v2 is NOT in TRAITS', () => {
      expect(TRAITS['feral_instinct_v2' as keyof typeof TRAITS]).toBeUndefined();
    });

    it('feral_instinct still exists (unchanged)', () => {
      expect(TRAITS.feral_instinct).toBeDefined();
    });
  });

  describe('all new traits have valid metadata', () => {
    for (const id of NEW_TRAIT_IDS) {
      const trait = TRAITS[id as keyof typeof TRAITS];
      if (!trait) continue;

      it(`${id} has matching id and key`, () => {
        expect(trait.id).toBe(id);
      });

      it(`${id} has non-empty name`, () => {
        expect(trait.name.length).toBeGreaterThan(3);
      });

      it(`${id} has non-empty description`, () => {
        expect(trait.description.length).toBeGreaterThan(5);
      });

      it(`${id} has valid tier`, () => {
        expect(VALID_TIERS).toContain(trait.tier);
      });

      it(`${id} has positive sign`, () => {
        expect(trait.sign).toBe('positive');
      });

      it(`${id} has weight > 0`, () => {
        expect(trait.weight).toBeGreaterThan(0);
      });

      it(`${id} has at least one effect property`, () => {
        expect(Object.keys(trait.effect).length).toBeGreaterThan(0);
      });

      if (trait.synergy) {
        it(`${id} synergy uses valid Archetypes`, () => {
          for (const a of trait.synergy!) {
            expect(VALID_ARCHETYPES, `${id} synergy has invalid archetype: ${a}`).toContain(a);
          }
        });
      }

      if (trait.antiSynergy) {
        it(`${id} antiSynergy uses valid Archetypes`, () => {
          for (const a of trait.antiSynergy!) {
            expect(VALID_ARCHETYPES, `${id} antiSynergy has invalid archetype: ${a}`).toContain(a);
          }
        });
      }
    }
  });

  describe('specific trait effect assertions', () => {
    it('grim_orphan: attModLowHp === 1, defModLowHp === 1', () => {
      const t = TRAITS.grim_orphan as any;
      if (t) {
        expect(t.effect.attModLowHp).toBe(1);
        expect(t.effect.defModLowHp).toBe(1);
        expect(t.tier).toBe('Exceptional');
      }
    });

    it('iron_will: defModLate === 1, attModLate === 1', () => {
      const t = TRAITS.iron_will as any;
      if (t) {
        expect(t.effect.defModLate).toBe(1);
        expect(t.effect.attModLate).toBe(1);
        expect(t.tier).toBe('Exceptional');
      }
    });

    it('silent_killer: killWindowBonus === 2, fightPlanMod.killDesire === 3', () => {
      const t = TRAITS.silent_killer as any;
      if (t) {
        expect(t.effect.killWindowBonus).toBe(2);
        expect(t.effect.defModEarly).toBe(-1);
        expect(t.effect.fightPlanMod?.killDesire).toBe(3);
      }
    });

    it('primal_instinct: iniMod === 1, dmgBonus === 1, decMod === -2', () => {
      const t = TRAITS.primal_instinct as any;
      if (t) {
        expect(t.effect.iniMod).toBe(1);
        expect(t.effect.dmgBonus).toBe(1);
        expect(t.effect.decMod).toBe(-2);
        expect(t.effect.fightPlanMod?.AL).toBe(3);
      }
    });

    it('born_in_blood: attModLowHp === 1, iniMod === 1, fightPlanMod.killDesire === 2', () => {
      const t = TRAITS.born_in_blood as any;
      if (t) {
        expect(t.effect.attModLowHp).toBe(1);
        expect(t.effect.iniMod).toBe(1);
        expect(t.effect.fightPlanMod?.killDesire).toBe(2);
        expect(t.antiSynergy).toContain('cunning');
        expect(t.antiSynergy).not.toContain('tactical');
      }
    });

    it('chaos_touched: dmgBonus === 1, attModLate === 1', () => {
      const t = TRAITS.chaos_touched as any;
      if (t) {
        expect(t.effect.dmgBonus).toBe(1);
        expect(t.effect.attModLate).toBe(1);
      }
    });
  });
});
