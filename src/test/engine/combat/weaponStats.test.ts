import { describe, it, expect } from 'vitest';
import { weaponDamageBonus, getWeaponInitiativeMod } from '@/engine/combat/mechanics/weaponStats';
import { WEAPONS } from '@/data/equipment/weapons';
import { FightingStyle } from '@/types/shared.types';

describe('weaponStats', () => {
  describe('weaponDamageBonus', () => {
    it('returns 0 for missing / unknown weapon', () => {
      expect(weaponDamageBonus(undefined)).toBe(0);
      expect(weaponDamageBonus('not_a_weapon')).toBe(0);
    });

    it('heavy weapons hit harder than light weapons', () => {
      // dagger (weight 1) vs maul (weight 6), no matched-style bonus
      expect(weaponDamageBonus('dagger')).toBeLessThan(0);
      expect(weaponDamageBonus('maul')).toBeGreaterThan(0);
      expect(weaponDamageBonus('dagger')).toBeLessThan(weaponDamageBonus('maul'));
    });

    it('weight-3 weapon is heft-neutral', () => {
      // longsword is weight 3; without a matched style the heft term is 0
      expect(weaponDamageBonus('longsword')).toBe(0);
    });

    it('grants a matched-style bonus when the weapon prefers the wielder style', () => {
      // broadsword preferredStyles includes StrikingAttack
      expect(weaponDamageBonus('broadsword', FightingStyle.StrikingAttack)).toBe(
        weaponDamageBonus('broadsword') + 1
      );
      // AimedBlow is not preferred by broadsword → no bonus
      expect(weaponDamageBonus('broadsword', FightingStyle.AimedBlow)).toBe(
        weaponDamageBonus('broadsword')
      );
    });
  });

  describe('getWeaponInitiativeMod', () => {
    it('light weapons are faster, heavy weapons slower', () => {
      expect(getWeaponInitiativeMod('dagger')).toBeGreaterThan(0);
      expect(getWeaponInitiativeMod('maul')).toBeLessThan(0);
    });

    it('returns 0 for missing weapon', () => {
      expect(getWeaponInitiativeMod(undefined)).toBe(0);
    });

    it('trades off against damage (heavy = high damage, low initiative)', () => {
      expect(getWeaponInitiativeMod('maul')).toBeLessThan(getWeaponInitiativeMod('dagger'));
      expect(weaponDamageBonus('maul')).toBeGreaterThan(weaponDamageBonus('dagger'));
    });
  });

  describe('weapon data integrity', () => {
    it('all weapon ids are unique', () => {
      const ids = WEAPONS.map((w) => w.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all weapon codes are unique (no canonical-code collisions)', () => {
      const codes = WEAPONS.map((w) => w.code);
      expect(new Set(codes).size).toBe(codes.length);
    });
  });
});
