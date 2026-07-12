/**
 * New traits from lore expansion — verifies gutter_blood, clutch_survivor,
 * and adrenaline_surge are registered, well-formed, and produce correct
 * dynamic mods under the right combat conditions.
 *
 * Pre-merge test: these will FAIL on main (traits don't exist yet) and
 * PASS after the jules-lore-expansion branch is merged.
 */
import { describe, it, expect } from 'vitest';
import { TRAITS, getDynamicTraitMods, type DynamicTraitContext } from '@/engine/traits';
import { traitTrainingPool } from '@/engine/training/trainingGains/traitTraining';
import type { Warrior } from '@/types/warrior.types';
import type { Trainer } from '@/types/shared.types';

function mockWarrior(traits: string[]): Warrior {
  return { traits, style: 'SlashingAttack' } as any as Warrior;
}

function mockTrainer(tier: 'Novice' | 'Seasoned' | 'Master'): Trainer {
  return { id: 't1', name: 'Test', tier } as any as Trainer;
}

describe('new traits from lore expansion', () => {
  describe('gutter_blood', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.gutter_blood).toBeDefined();
    });

    it('has correct metadata (tier Notable, sign positive, weight 0.7)', () => {
      const t = TRAITS.gutter_blood!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.7);
      expect(t.name).toBe('Gutter Blood');
    });

    it('has effect attModLowHp 1', () => {
      expect(TRAITS.gutter_blood!.effect.attModLowHp).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.gutter_blood!;
      expect(t.id).toBe('gutter_blood');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns attMod 1 when hpRatio < 0.5', () => {
      const ctx: DynamicTraitContext = {
        phase: 'MID',
        hpRatio: 0.3,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['gutter_blood']), ctx);
      expect(mods.attMod).toBe(1);
    });

    it('getDynamicTraitMods returns attMod 0 when hpRatio >= 0.5', () => {
      const ctx: DynamicTraitContext = {
        phase: 'MID',
        hpRatio: 0.6,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['gutter_blood']), ctx);
      expect(mods.attMod).toBe(0);
    });

    it('can be rolled at birth (tier is Common or Notable)', () => {
      const t = TRAITS.gutter_blood!;
      expect(['Common', 'Notable'].includes(t.tier)).toBe(true);
    });
  });

  describe('clutch_survivor', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.clutch_survivor).toBeDefined();
    });

    it('has correct metadata (tier Exceptional, sign positive, weight 0.6)', () => {
      const t = TRAITS.clutch_survivor!;
      expect(t.tier).toBe('Exceptional');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.6);
      expect(t.name).toBe('Clutch Survivor');
    });

    it('has effect attModLate 1', () => {
      expect(TRAITS.clutch_survivor!.effect.attModLate).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.clutch_survivor!;
      expect(t.id).toBe('clutch_survivor');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns attMod 1 when phase is LATE', () => {
      const ctx: DynamicTraitContext = {
        phase: 'LATE',
        hpRatio: 0.5,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['clutch_survivor']), ctx);
      expect(mods.attMod).toBe(1);
    });

    it('getDynamicTraitMods returns attMod 0 when phase is OPENING', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 0.5,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['clutch_survivor']), ctx);
      expect(mods.attMod).toBe(0);
    });

    it('getDynamicTraitMods returns attMod 0 when phase is MID', () => {
      const ctx: DynamicTraitContext = {
        phase: 'MID',
        hpRatio: 0.5,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['clutch_survivor']), ctx);
      expect(mods.attMod).toBe(0);
    });

    it('CANNOT be rolled at birth (tier is Exceptional)', () => {
      const t = TRAITS.clutch_survivor!;
      expect(['Exceptional', 'Signature'].includes(t.tier)).toBe(true);
    });

    it('CAN be trained via Seasoned trainer (withinCeiling check)', () => {
      const warrior = mockWarrior([]);
      const trainer = mockTrainer('Seasoned');
      const pool = traitTrainingPool(warrior, trainer);
      expect(pool.some((t) => t.id === 'clutch_survivor')).toBe(true);
    });
  });

  describe('adrenaline_surge', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.adrenaline_surge).toBeDefined();
    });

    it('has correct metadata (tier Common, sign positive, weight 0.8)', () => {
      const t = TRAITS.adrenaline_surge!;
      expect(t.tier).toBe('Common');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.8);
      expect(t.name).toBe('Adrenaline Surge');
    });

    it('has effect iniModFresh 1', () => {
      expect(TRAITS.adrenaline_surge!.effect.iniModFresh).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.adrenaline_surge!;
      expect(t.id).toBe('adrenaline_surge');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns iniMod 1 when endRatio > 0.7', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 1.0,
        endRatio: 0.8,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['adrenaline_surge']), ctx);
      expect(mods.iniMod).toBe(1);
    });

    it('getDynamicTraitMods returns iniMod 0 when endRatio <= 0.7', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 1.0,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['adrenaline_surge']), ctx);
      expect(mods.iniMod).toBe(0);
    });

    it('can be rolled at birth (tier is Common)', () => {
      const t = TRAITS.adrenaline_surge!;
      expect(['Common', 'Notable'].includes(t.tier)).toBe(true);
    });
  });

  describe('asylum_born', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.asylum_born).toBeDefined();
    });

    it('has correct metadata (tier Notable, sign positive, weight 0.7)', () => {
      const t = TRAITS.asylum_born!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.7);
      expect(t.name).toBe('Asylum Born');
    });

    it('has effect defModLowHp 1', () => {
      expect(TRAITS.asylum_born!.effect.defModLowHp).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.asylum_born!;
      expect(t.id).toBe('asylum_born');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns defMod 1 when hpRatio < 0.5', () => {
      const ctx: DynamicTraitContext = {
        phase: 'MID',
        hpRatio: 0.3,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['asylum_born']), ctx);
      expect(mods.defMod).toBe(1);
    });

    it('getDynamicTraitMods returns defMod 0 when hpRatio >= 0.5', () => {
      const ctx: DynamicTraitContext = {
        phase: 'MID',
        hpRatio: 0.6,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['asylum_born']), ctx);
      expect(mods.defMod).toBe(0);
    });

    it('can be rolled at birth (tier is Notable)', () => {
      const t = TRAITS.asylum_born!;
      expect(['Common', 'Notable'].includes(t.tier)).toBe(true);
    });
  });

  describe('street_scrapper', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.street_scrapper).toBeDefined();
    });

    it('has correct metadata (tier Notable, sign positive, weight 0.7)', () => {
      const t = TRAITS.street_scrapper!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.7);
      expect(t.name).toBe('Street Scrapper');
    });

    it('has effect defModLate 1', () => {
      expect(TRAITS.street_scrapper!.effect.defModLate).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.street_scrapper!;
      expect(t.id).toBe('street_scrapper');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns defMod 1 when phase is LATE', () => {
      const ctx: DynamicTraitContext = {
        phase: 'LATE',
        hpRatio: 0.5,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['street_scrapper']), ctx);
      expect(mods.defMod).toBe(1);
    });

    it('getDynamicTraitMods returns defMod 0 when phase is OPENING', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 0.5,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['street_scrapper']), ctx);
      expect(mods.defMod).toBe(0);
    });

    it('can be rolled at birth (tier is Notable)', () => {
      const t = TRAITS.street_scrapper!;
      expect(['Common', 'Notable'].includes(t.tier)).toBe(true);
    });
  });

  describe('gutter_cunning', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.gutter_cunning).toBeDefined();
    });

    it('has correct metadata (tier Notable, sign positive, weight 0.5)', () => {
      const t = TRAITS.gutter_cunning!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.5);
      expect(t.name).toBe('Gutter Cunning');
    });

    it('has effect attModEarly 1', () => {
      expect(TRAITS.gutter_cunning!.effect.attModEarly).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.gutter_cunning!;
      expect(t.id).toBe('gutter_cunning');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns attMod 1 when phase is OPENING', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 1.0,
        endRatio: 0.8,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['gutter_cunning']), ctx);
      expect(mods.attMod).toBe(1);
    });

    it('getDynamicTraitMods returns attMod 0 when phase is MID', () => {
      const ctx: DynamicTraitContext = {
        phase: 'MID',
        hpRatio: 1.0,
        endRatio: 0.8,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['gutter_cunning']), ctx);
      expect(mods.attMod).toBe(0);
    });

    it('can be rolled at birth (tier is Notable)', () => {
      const t = TRAITS.gutter_cunning!;
      expect(['Common', 'Notable'].includes(t.tier)).toBe(true);
    });
  });

  describe('street_rat_cunning', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.street_rat_cunning).toBeDefined();
    });

    it('has correct metadata (tier Notable, sign positive, weight 0.7)', () => {
      const t = TRAITS.street_rat_cunning!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.7);
      expect(t.name).toBe('Street Rat Cunning');
    });

    it('has effect iniModFresh 1', () => {
      expect(TRAITS.street_rat_cunning!.effect.iniModFresh).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.street_rat_cunning!;
      expect(t.id).toBe('street_rat_cunning');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('getDynamicTraitMods returns iniMod 1 when endRatio > 0.7', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 1.0,
        endRatio: 0.8,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['street_rat_cunning']), ctx);
      expect(mods.iniMod).toBe(1);
    });

    it('getDynamicTraitMods returns iniMod 0 when endRatio <= 0.7', () => {
      const ctx: DynamicTraitContext = {
        phase: 'OPENING',
        hpRatio: 1.0,
        endRatio: 0.5,
        consecutiveHits: 0,
      };
      const mods = getDynamicTraitMods(mockWarrior(['street_rat_cunning']), ctx);
      expect(mods.iniMod).toBe(0);
    });

    it('can be rolled at birth (tier is Notable)', () => {
      const t = TRAITS.street_rat_cunning!;
      expect(['Common', 'Notable'].includes(t.tier)).toBe(true);
    });
  });

  describe('removed duplicate traits', () => {
    it('pit_scarred is undefined (duplicate of asylum_born)', () => {
      expect(TRAITS.pit_scarred).toBeUndefined();
    });

    it('orphan_resilience is undefined (duplicate of asylum_born)', () => {
      expect(TRAITS.orphan_resilience).toBeUndefined();
    });
  });
});
