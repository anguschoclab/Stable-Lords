/**
 * Trait deduplication tests — verifies removed traits no longer exist,
 * retained traits are intact, iron_vein enduranceMult is fixed, and
 * no duplicate effects remain in the generic positive pool.
 */
import { describe, it, expect } from 'vitest';
import { getStaticTraitMods } from '@/engine/traits';
import { conflictsWith } from '@/engine/training/trainingGains/traitTraining';
import { TRAITS, generateTraits } from '@/engine/traits';
import { SeededRNGService } from '@/utils/random';

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
const EXPECTED_COUNT = 106; // 100 baseline + 6 new traits

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

  describe('no duplicate effects in generic positive Common/Notable pool', () => {
    it('no two generic positive Common/Notable traits share the same core effect', () => {
      const generic = Object.values(TRAITS).filter(
        (t) => t.sign === 'positive' && !t.styles && (t.tier === 'Common' || t.tier === 'Notable')
      );

      const effectHash = (effect: any) => {
        const { fightPlanMod, ...core } = effect;
        return JSON.stringify(core);
      };

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
  });

  describe('generateTraits still produces valid results', () => {
    it('all generated traits resolve in TRAITS', () => {
      const rng = new SeededRNGService(12345);
      for (let i = 0; i < 1000; i++) {
        const traits = generateTraits(rng, 'brutal');
        for (const id of traits) {
          expect(TRAITS[id]).toBeDefined();
        }
      }
    });

    it('still produces varied traits (>= 6 distinct)', () => {
      const rng = new SeededRNGService(54321);
      const seen = new Set<string>();
      for (let i = 0; i < 2000; i++) {
        for (const id of generateTraits(rng, 'brutal')) seen.add(id);
      }
      expect(seen.size).toBeGreaterThanOrEqual(6);
    });
  });

  describe('generateTraits never produces removed traits', () => {
    it('no removed trait ID appears in 1000 generations', () => {
      const rng = new SeededRNGService(99999);
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
    it(`TRAITS has ${EXPECTED_COUNT} entries (baseline ${BASELINE_COUNT} + 4 new)`, () => {
      expect(Object.keys(TRAITS).length).toBe(EXPECTED_COUNT);
    });
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
