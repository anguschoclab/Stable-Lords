/**
 * New traits from lore-content-expansion — verifies pit_born and ashen_lungs
 * are registered, well-formed, and produce correct static mods.
 */
import { describe, it, expect } from 'vitest';
import { TRAITS, getStaticTraitMods } from '@/engine/traits';
import type { Warrior } from '@/types/warrior.types';

function mockWarrior(traits: string[]): Warrior {
  return { traits } as any as Warrior;
}

describe('new traits from lore expansion', () => {
  describe('pit_born', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.pit_born).toBeDefined();
    });

    it('has correct metadata', () => {
      const t = TRAITS.pit_born!;
      expect(t.tier).toBe('Common');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.7);
      expect(t.name).toBe('Pit-Born');
    });

    it('has effect { enduranceMult: 1.1 }', () => {
      const t = TRAITS.pit_born!;
      expect(t.effect.enduranceMult).toBe(1.1);
    });

    it('getStaticTraitMods returns enduranceMult 1.1', () => {
      const mods = getStaticTraitMods(mockWarrior(['pit_born']));
      expect(mods.enduranceMult).toBeCloseTo(1.1);
    });
  });

  describe('ashen_lungs', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.ashen_lungs).toBeDefined();
    });

    it('has correct metadata', () => {
      const t = TRAITS.ashen_lungs!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.6);
      expect(t.name).toBe('Ashen Lungs');
    });

    it('has effect { enduranceMult: 0.9, dmgBonus: 1 }', () => {
      const t = TRAITS.ashen_lungs!;
      expect(t.effect.enduranceMult).toBe(0.9);
      expect(t.effect.dmgBonus).toBe(1);
    });

    it('synergy includes brutal', () => {
      const t = TRAITS.ashen_lungs!;
      expect(t.synergy).toContain('brutal');
    });

    it('getStaticTraitMods returns enduranceMult 0.9 and dmgBonus 1', () => {
      const mods = getStaticTraitMods(mockWarrior(['ashen_lungs']));
      expect(mods.enduranceMult).toBeCloseTo(0.9);
      expect(mods.dmgBonus).toBe(1);
    });
  });

  describe('both traits pass invariant checks', () => {
    it('pit_born has non-empty description and id matches key', () => {
      const t = TRAITS.pit_born!;
      expect(t.id).toBe('pit_born');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });

    it('ashen_lungs has non-empty description and id matches key', () => {
      const t = TRAITS.ashen_lungs!;
      expect(t.id).toBe('ashen_lungs');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('silent_one', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.silent_one).toBeDefined();
    });

    it('has correct metadata', () => {
      const t = TRAITS.silent_one!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.name).toBe('Silent One');
    });

    it('has effect defMod 1 and decMod 1', () => {
      const t = TRAITS.silent_one!;
      expect(t.effect.defMod).toBe(1);
      expect(t.effect.decMod).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.silent_one!;
      expect(t.id).toBe('silent_one');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('blood_drunk', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.blood_drunk).toBeDefined();
    });

    it('has effect attModLowHp 2 and defModLowHp -2', () => {
      const t = TRAITS.blood_drunk!;
      expect(t.effect.attModLowHp).toBe(2);
      expect(t.effect.defModLowHp).toBe(-2);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.blood_drunk!;
      expect(t.id).toBe('blood_drunk');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('paranoid', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.paranoid).toBeDefined();
    });

    it('has effect defModEarly 2 and decMod -1', () => {
      const t = TRAITS.paranoid!;
      expect(t.effect.defModEarly).toBe(2);
      expect(t.effect.decMod).toBe(-1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.paranoid!;
      expect(t.id).toBe('paranoid');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('cold_eyed', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.cold_eyed).toBeDefined();
    });

    it('has effect iniMod 1 and decMod 1', () => {
      const t = TRAITS.cold_eyed!;
      expect(t.effect.iniMod).toBe(1);
      expect(t.effect.decMod).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.cold_eyed!;
      expect(t.id).toBe('cold_eyed');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('survivalist', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.survivalist).toBeDefined();
    });

    it('has effect defModLowHp 2', () => {
      const t = TRAITS.survivalist!;
      expect(t.effect.defModLowHp).toBe(2);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.survivalist!;
      expect(t.id).toBe('survivalist');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });
});
