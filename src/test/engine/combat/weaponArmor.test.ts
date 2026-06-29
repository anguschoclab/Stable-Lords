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

    it('all shields return none damage type', () => {
      expect(WEAPON_DAMAGE_TYPE['small_shield']).toBe('none');
      expect(WEAPON_DAMAGE_TYPE['medium_shield']).toBe('none');
      expect(WEAPON_DAMAGE_TYPE['large_shield']).toBe('none');
    });

    it('all weapon entries have valid damage types (slash, bash, pierce, or none)', () => {
      const validTypes = new Set(['slash', 'bash', 'pierce', 'none']);
      for (const [id, dtype] of Object.entries(WEAPON_DAMAGE_TYPE)) {
        expect(validTypes.has(dtype), `invalid damage type for ${id}: ${dtype}`).toBe(true);
      }
    });
  });

  describe('applyArmorTypeMod additional armor types', () => {
    it('applies studded_leather multipliers for slash and pierce', () => {
      // longsword = slash, studded_leather = slash: 0.88
      expect(applyArmorTypeMod(100, 'longsword', 'studded_leather')).toBe(88);
      // dagger = pierce, studded_leather = pierce: 1.05
      expect(applyArmorTypeMod(100, 'dagger', 'studded_leather')).toBe(105);
    });

    it('applies ring_mail multipliers for slash, pierce, and bash', () => {
      // longsword = slash, ring_mail = slash: 0.9
      expect(applyArmorTypeMod(100, 'longsword', 'ring_mail')).toBe(90);
      // dagger = pierce, ring_mail = pierce: 0.9
      expect(applyArmorTypeMod(100, 'dagger', 'ring_mail')).toBe(90);
      // mace = bash, ring_mail = bash: 1.1
      expect(applyArmorTypeMod(100, 'mace', 'ring_mail')).toBe(110);
    });

    it('applies scale_mail multipliers for slash and pierce', () => {
      // longsword = slash, scale_mail = slash: 0.8
      expect(applyArmorTypeMod(100, 'longsword', 'scale_mail')).toBe(80);
      // dagger = pierce, scale_mail = pierce: 1.15
      expect(applyArmorTypeMod(100, 'dagger', 'scale_mail')).toBe(115);
    });

    it('applies plate_mail multipliers for slash, bash, and pierce', () => {
      // longsword = slash, plate_mail = slash: 0.85
      expect(applyArmorTypeMod(100, 'longsword', 'plate_mail')).toBe(85);
      // mace = bash, plate_mail = bash: 0.85
      expect(applyArmorTypeMod(100, 'mace', 'plate_mail')).toBe(85);
      // dagger = pierce, plate_mail = pierce: 0.85
      expect(applyArmorTypeMod(100, 'dagger', 'plate_mail')).toBe(85);
    });

    it('applies plate_armor multipliers for slash, bash, and pierce', () => {
      // longsword = slash, plate_armor = slash: 0.8
      expect(applyArmorTypeMod(100, 'longsword', 'plate_armor')).toBe(80);
      // mace = bash, plate_armor = bash: 0.8
      expect(applyArmorTypeMod(100, 'mace', 'plate_armor')).toBe(80);
      // dagger = pierce, plate_armor = pierce: 0.8
      expect(applyArmorTypeMod(100, 'dagger', 'plate_armor')).toBe(80);
    });

    it('returns unmodified damage for unknown armorId', () => {
      expect(applyArmorTypeMod(100, 'dagger', 'unknown_armor')).toBe(100);
    });

    it('returns 0 for damage = 0 regardless of multiplier', () => {
      expect(applyArmorTypeMod(0, 'dagger', 'leather')).toBe(0);
      expect(applyArmorTypeMod(0, 'longsword', 'chain_mail')).toBe(0);
    });

    it('returns unmodified damage for bash vs chain_mail (no bash entry)', () => {
      // chain_mail has pierce: 0.8 and slash: 1.1, but no bash entry → defaults to 1.0
      expect(applyArmorTypeMod(100, 'mace', 'chain_mail')).toBe(100);
    });
  });
});
