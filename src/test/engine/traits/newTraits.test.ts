/**
 * New traits from lore-content-expansion — verifies ashen_lungs
 * is registered, well-formed, and produces correct static mods.
 */
import { describe, it, expect } from 'vitest';
import { TRAITS, getStaticTraitMods } from '@/engine/traits';
import type { Warrior } from '@/types/warrior.types';

function mockWarrior(traits: string[]): Warrior {
  return { traits } as any as Warrior;
}

describe('new traits from lore expansion', () => {
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

  describe('ashen_lungs invariant checks', () => {
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

  describe('alley_stalker', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.alley_stalker).toBeDefined();
    });

    it('has correct metadata', () => {
      const t = TRAITS.alley_stalker!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.6);
      expect(t.name).toBe('Alley Stalker');
    });

    it('has effect iniMod 1, killWindowBonus 1, fightPlanMod AL 2', () => {
      const t = TRAITS.alley_stalker!;
      expect(t.effect.iniMod).toBe(1);
      expect(t.effect.killWindowBonus).toBe(1);
      expect(t.effect.fightPlanMod?.AL).toBe(2);
    });

    it('synergy includes agile and cunning, antiSynergy includes tank', () => {
      const t = TRAITS.alley_stalker!;
      expect(t.synergy).toContain('agile');
      expect(t.synergy).toContain('cunning');
      expect(t.antiSynergy).toContain('tank');
    });

    it('getStaticTraitMods returns iniMod 1', () => {
      const mods = getStaticTraitMods(mockWarrior(['alley_stalker']));
      expect(mods.iniMod).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.alley_stalker!;
      expect(t.id).toBe('alley_stalker');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('iron_vein', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.iron_vein).toBeDefined();
    });

    it('has correct metadata', () => {
      const t = TRAITS.iron_vein!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.6);
      expect(t.name).toBe('Iron Vein');
    });

    it('has effect defMod 1, enduranceMult 0.9, fightPlanMod OE -1', () => {
      const t = TRAITS.iron_vein!;
      expect(t.effect.defMod).toBe(1);
      expect(t.effect.enduranceMult).toBeCloseTo(0.9);
      expect(t.effect.fightPlanMod?.OE).toBe(-1);
    });

    it('synergy includes tank and brutal, antiSynergy includes agile', () => {
      const t = TRAITS.iron_vein!;
      expect(t.synergy).toContain('tank');
      expect(t.synergy).toContain('brutal');
      expect(t.antiSynergy).toContain('agile');
    });

    it('getStaticTraitMods returns defMod 1 and enduranceMult ~0.9', () => {
      const mods = getStaticTraitMods(mockWarrior(['iron_vein']));
      expect(mods.defMod).toBe(1);
      expect(mods.enduranceMult).toBeCloseTo(0.9);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.iron_vein!;
      expect(t.id).toBe('iron_vein');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });

  describe('gallows_humor', () => {
    it('is registered in TRAITS', () => {
      expect(TRAITS.gallows_humor).toBeDefined();
    });

    it('has correct metadata', () => {
      const t = TRAITS.gallows_humor!;
      expect(t.tier).toBe('Notable');
      expect(t.sign).toBe('positive');
      expect(t.weight).toBe(0.5);
      expect(t.name).toBe('Gallows Humor');
    });

    it('has effect decMod 1, defModLate 1', () => {
      const t = TRAITS.gallows_humor!;
      expect(t.effect.decMod).toBe(1);
      expect(t.effect.defModLate).toBe(1);
    });

    it('synergy includes tank', () => {
      const t = TRAITS.gallows_humor!;
      expect(t.synergy).toContain('tank');
    });

    it('getStaticTraitMods returns decMod 1', () => {
      const mods = getStaticTraitMods(mockWarrior(['gallows_humor']));
      expect(mods.decMod).toBe(1);
    });

    it('id matches key and has non-empty description', () => {
      const t = TRAITS.gallows_humor!;
      expect(t.id).toBe('gallows_humor');
      expect(t.description.trim().length).toBeGreaterThan(5);
    });
  });
});
