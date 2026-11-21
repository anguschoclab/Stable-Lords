import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WEAPON_DAMAGE_TYPE,
  applyArmorTypeMod,
  applyFlatMitigation,
} from '@/engine/combat/mechanics/weaponArmor';
import * as equipmentUtils from '@/data/equipment/equipment.utils';

// We need to spy on the real function or provide a complete mock since we can't easily mock just getItemById
// without breaking the internal WEAPON_DAMAGE_TYPE and ARMOR_TYPE_MULT mappings which are initialized in the module.

describe('weaponArmor', () => {
  describe('applyArmorTypeMod', () => {
    it('returns unmodified damage if weaponId is undefined', () => {
      expect(applyArmorTypeMod(100, undefined, 'APL')).toBe(100);
    });

    it('returns unmodified damage if armorId is undefined', () => {
      expect(applyArmorTypeMod(100, 'dagger', undefined)).toBe(100);
    });

    it('returns unmodified damage if weapon has no damage type', () => {
      expect(applyArmorTypeMod(100, 'unknown_weapon', 'APL')).toBe(100);
    });

    it('returns unmodified damage if weapon damage type is none', () => {
      expect(applyArmorTypeMod(100, 'small_shield', 'APL')).toBe(100);
    });

    it('returns unmodified damage if armor has no multiplier for damage type', () => {
      // ringmail has no multiplier for slash
      expect(applyArmorTypeMod(100, 'scimitar', 'ARM')).toBe(100);
    });

    it('returns unmodified damage for none_armor', () => {
      expect(applyArmorTypeMod(100, 'dagger', 'none_armor')).toBe(100);
    });

    it('applies armor multiplier for specific combinations', () => {
      // dagger = pierce, padded leather = pierce: 1.05
      expect(applyArmorTypeMod(100, 'dagger', 'APL')).toBe(105);

      // longsword = slash, padded leather = slash: 1.05 (chopped through readily)
      expect(applyArmorTypeMod(100, 'longsword', 'APL')).toBe(105);

      // mace = bash, padded leather = bash: 0.9 (cushions smashing blows)
      expect(applyArmorTypeMod(100, 'mace', 'APL')).toBe(90);

      // dagger = pierce, chain_mail: matrix cell 0.7 (Jalopy — DA poor vs
      // ASM+) composed with the pierce baseline 1.15 → 0.805
      expect(applyArmorTypeMod(100, 'dagger', 'ACM')).toBe(81);

      // longsword = slash, chain_mail: no slash baseline → matrix cell for
      // longsword only covers APM/APA → identity
      expect(applyArmorTypeMod(100, 'longsword', 'ACM')).toBe(100);
    });

    it('handles rounding correctly', () => {
      // 55 * 1.05 = 57.75 -> 58
      expect(applyArmorTypeMod(55, 'dagger', 'APL')).toBe(58);
      // 55 * 1.05 = 57.75 -> 58
      expect(applyArmorTypeMod(55, 'longsword', 'APL')).toBe(58);
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

    it('applies ringmail multipliers — crushing absorb, thin-blade weak', () => {
      // longsword = slash, ringmail: no slash baseline → identity
      expect(applyArmorTypeMod(100, 'longsword', 'ARM')).toBe(100);
      // dagger = pierce, ringmail = pierce: 1.1 (thin blades)
      expect(applyArmorTypeMod(100, 'dagger', 'ARM')).toBe(110);
      // mace = bash, ringmail = bash: 0.85 (crushing absorbed)
      expect(applyArmorTypeMod(100, 'mace', 'ARM')).toBe(85);
    });

    it('applies scalemail multipliers for slash and pierce', () => {
      // longsword = slash, scalemail = slash: 0.8
      expect(applyArmorTypeMod(100, 'longsword', 'ASM')).toBe(80);
      // dagger = pierce, scalemail: matrix cell 0.7 × pierce baseline 1.15
      expect(applyArmorTypeMod(100, 'dagger', 'ASM')).toBe(81);
      // mace = bash, scalemail = bash: 1.1 (Assur's bash sweet spot)
      expect(applyArmorTypeMod(100, 'mace', 'ASM')).toBe(110);
    });

    it('applies platemail multipliers for slash, bash, and pierce', () => {
      // longsword = slash: matrix cell 0.9 × platemail slash 0.85 → 76.5 → 77
      expect(applyArmorTypeMod(100, 'longsword', 'APM')).toBe(77);
      // mace = bash, platemail = bash: 0.85
      expect(applyArmorTypeMod(100, 'mace', 'APM')).toBe(85);
      // dagger = pierce: matrix cell 1.0 × platemail pierce 0.85
      expect(applyArmorTypeMod(100, 'dagger', 'APM')).toBe(85);
    });

    it('applies plate armor multipliers for slash, bash, and pierce', () => {
      // longsword = slash: matrix cell 0.85 × plate armor slash 0.8 → 68
      expect(applyArmorTypeMod(100, 'longsword', 'APA')).toBe(68);
      // mace = bash, plate armor = bash: 0.85 (shells still smash)
      expect(applyArmorTypeMod(100, 'mace', 'APA')).toBe(85);
      // dagger = pierce: matrix cell 1.0 × plate armor pierce 0.8
      expect(applyArmorTypeMod(100, 'dagger', 'APA')).toBe(80);
    });

    it('returns unmodified damage for unknown armorId', () => {
      expect(applyArmorTypeMod(100, 'dagger', 'unknown_armor')).toBe(100);
    });

    it('returns 0 for damage = 0 regardless of multiplier', () => {
      expect(applyArmorTypeMod(0, 'dagger', 'APL')).toBe(0);
      expect(applyArmorTypeMod(0, 'longsword', 'ACM')).toBe(0);
    });

    it('applies chainmail bash resist (heavier ringmail profile)', () => {
      // chainmail has bash: 0.8 and pierce: 1.15
      expect(applyArmorTypeMod(100, 'mace', 'ACM')).toBe(80);
    });
  });

  describe('applyFlatMitigation', () => {
    it('armor-only mitigation reduces damage by armor mitigation value', () => {
      // leather mitigation = 2, helm = none_helm (mitigation 0)
      expect(applyFlatMitigation(20, 'APL', 'none_helm')).toBe(18);
    });

    it('helm-only mitigation reduces damage by helm mitigation value', () => {
      // steel_cap mitigation = 2, armor = none_armor (mitigation 0)
      expect(applyFlatMitigation(20, 'none_armor', 'steel_cap')).toBe(18);
    });

    it('armor + helm mitigation stack additively', () => {
      // chain_mail mitigation = 6, full_helm mitigation = 4 → total 10
      expect(applyFlatMitigation(20, 'ACM', 'full_helm')).toBe(10);
    });

    it('floors damage at 1 (never reduces to 0)', () => {
      // plate_armor mitigation = 10, full_helm mitigation = 4 → total 14
      // damage 5 → 5 - 14 = -9 → floored at 1
      expect(applyFlatMitigation(5, 'APA', 'full_helm')).toBe(1);
    });

    it('damage of 0 stays 0 (no negative floor for zero input)', () => {
      expect(applyFlatMitigation(0, 'APA', 'full_helm')).toBe(0);
    });

    it('undefined armorId is treated as 0 mitigation', () => {
      expect(applyFlatMitigation(20, undefined, 'steel_cap')).toBe(18);
    });

    it('undefined helmId is treated as 0 mitigation', () => {
      expect(applyFlatMitigation(20, 'APL', undefined)).toBe(18);
    });

    it('both undefined ids result in no mitigation', () => {
      expect(applyFlatMitigation(20, undefined, undefined)).toBe(20);
    });

    it('unknown armor/helm ids are treated as 0 mitigation', () => {
      expect(applyFlatMitigation(20, 'unknown_armor', 'unknown_helm')).toBe(20);
    });

    it('none_armor and none_helm result in no mitigation', () => {
      expect(applyFlatMitigation(20, 'none_armor', 'none_helm')).toBe(20);
    });
  });
});

describe('Weapon & Armor Mechanics', () => {
  describe('applyArmorTypeMod', () => {
    it('returns original damage if weaponId or armorId is missing', () => {
      expect(applyArmorTypeMod(10, undefined, 'APL')).toBe(10);
      expect(applyArmorTypeMod(10, 'dagger', undefined)).toBe(10);
      expect(applyArmorTypeMod(10, undefined, undefined)).toBe(10);
    });

    it('returns original damage if weapon type is none', () => {
      expect(applyArmorTypeMod(10, 'small_shield', 'APL')).toBe(10);
    });

    it('returns original damage if weapon type is unknown', () => {
      expect(applyArmorTypeMod(10, 'unknown_weapon', 'APL')).toBe(10);
    });

    it('applies correct multiplier based on type match', () => {
      // dagger is pierce. leather vs pierce = 1.05
      // 10 * 1.05 = 10.5 -> round to 11
      expect(applyArmorTypeMod(10, 'dagger', 'APL')).toBe(11);

      // longsword is slash. matrix cell 0.9 × platemail slash 0.85 = 0.765
      // 10 * 0.765 = 7.65 -> round to 8
      expect(applyArmorTypeMod(10, 'longsword', 'APM')).toBe(8);

      // mace is bash. scalemail bash 1.1 -> 11
      expect(applyArmorTypeMod(10, 'mace', 'ASM')).toBe(11);
    });
  });

  describe('applyFlatMitigation', () => {
    let getItemByIdSpy: any;

    beforeEach(() => {
      getItemByIdSpy = vi.spyOn(equipmentUtils, 'getItemById').mockImplementation((id: string) => {
        if (id === 'APA') return { mitigation: 10 } as any;
        if (id === 'APL') return { mitigation: 2 } as any;
        if (id === 'full_helm') return { mitigation: 5 } as any;
        return undefined;
      });
    });

    afterEach(() => {
      getItemByIdSpy.mockRestore();
    });

    it('returns 0 if incoming damage is 0 or less', () => {
      expect(applyFlatMitigation(0, 'APL', 'full_helm')).toBe(0);
      expect(applyFlatMitigation(-5, 'APL', 'full_helm')).toBe(0);
    });

    it('subtracts total mitigation from damage', () => {
      // plate_armor (10) + full_helm (5) = 15 mitigation
      // 20 - 15 = 5
      expect(applyFlatMitigation(20, 'APA', 'full_helm')).toBe(5);

      // Only armor: leather (2)
      // 10 - 2 = 8
      expect(applyFlatMitigation(10, 'APL', undefined)).toBe(8);
    });

    it('floors damage at 1 if base damage > 0', () => {
      // plate_armor (10) + full_helm (5) = 15 mitigation.
      // 10 damage - 15 mitigation = -5. Floors to 1.
      expect(applyFlatMitigation(10, 'APA', 'full_helm')).toBe(1);
    });

    it('handles missing items correctly', () => {
      // missing/invalid items should return undefined mitigation (0)
      expect(applyFlatMitigation(10, 'unknown_armor', 'unknown_helm')).toBe(10);
    });
  });
});
