import { describe, it, expect } from 'vitest';
import { WEAPON_DAMAGE_TYPE, applyArmorTypeMod } from '@/engine/combat/mechanics/weaponArmor';

describe('weaponArmor', () => {
  describe('applyArmorTypeMod', () => {
    it('returns unmodified damage if weaponId is undefined', () => {
      expect(applyArmorTypeMod(100, undefined, 'leather')).toBe(100);
    });

    it('returns unmodified damage if armorId is undefined', () => {
      expect(applyArmorTypeMod(100, 'dagger', undefined)).toBe(100);
    });

    it('returns unmodified damage if weapon has no damage type', () => {
      expect(applyArmorTypeMod(100, 'unknown_weapon', 'leather')).toBe(100);
    });

    it('returns unmodified damage if weapon damage type is none', () => {
      expect(applyArmorTypeMod(100, 'small_shield', 'leather')).toBe(100);
    });

    it('returns unmodified damage if armor has no multiplier for damage type', () => {
      // padded armor has no multiplier for slash
      expect(applyArmorTypeMod(100, 'longsword', 'padded')).toBe(100);
    });

    it('returns unmodified damage for none_armor', () => {
      expect(applyArmorTypeMod(100, 'dagger', 'none_armor')).toBe(100);
    });

    it('applies armor multiplier for specific combinations', () => {
      // dagger = pierce, leather = pierce: 1.05
      expect(applyArmorTypeMod(100, 'dagger', 'leather')).toBe(105);

      // longsword = slash, leather = slash: 0.9
      expect(applyArmorTypeMod(100, 'longsword', 'leather')).toBe(90);

      // mace = bash, padded = bash: 0.9
      expect(applyArmorTypeMod(100, 'mace', 'padded')).toBe(90);

      // dagger = pierce, chain_mail = pierce: 0.8
      expect(applyArmorTypeMod(100, 'dagger', 'chain_mail')).toBe(80);

      // longsword = slash, chain_mail = slash: 1.1
      expect(applyArmorTypeMod(100, 'longsword', 'chain_mail')).toBe(110);
    });

    it('handles rounding correctly', () => {
      // 55 * 1.05 = 57.75 -> 58
      expect(applyArmorTypeMod(55, 'dagger', 'leather')).toBe(58);
      // 55 * 0.9 = 49.5 -> 50
      expect(applyArmorTypeMod(55, 'longsword', 'leather')).toBe(50);
    });
  });

  describe('WEAPON_DAMAGE_TYPE', () => {
    it('defines expected weapon damage types', () => {
      expect(WEAPON_DAMAGE_TYPE['dagger']).toBe('pierce');
      expect(WEAPON_DAMAGE_TYPE['longsword']).toBe('slash');
      expect(WEAPON_DAMAGE_TYPE['mace']).toBe('bash');
      expect(WEAPON_DAMAGE_TYPE['small_shield']).toBe('none');
    });
  });
});
