import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { applyArmorTypeMod, applyFlatMitigation } from '@/engine/combat/mechanics/weaponArmor';
import * as equipmentUtils from '@/data/equipment/equipment.utils';

// We need to spy on the real function or provide a complete mock since we can't easily mock just getItemById
// without breaking the internal WEAPON_DAMAGE_TYPE and ARMOR_TYPE_MULT mappings which are initialized in the module.

describe('Weapon & Armor Mechanics', () => {
  describe('applyArmorTypeMod', () => {
    it('returns original damage if weaponId or armorId is missing', () => {
      expect(applyArmorTypeMod(10, undefined, 'leather')).toBe(10);
      expect(applyArmorTypeMod(10, 'dagger', undefined)).toBe(10);
      expect(applyArmorTypeMod(10, undefined, undefined)).toBe(10);
    });

    it('returns original damage if weapon type is none', () => {
      expect(applyArmorTypeMod(10, 'small_shield', 'leather')).toBe(10);
    });

    it('returns original damage if weapon type is unknown', () => {
      expect(applyArmorTypeMod(10, 'unknown_weapon', 'leather')).toBe(10);
    });

    it('applies correct multiplier based on type match', () => {
      // dagger is pierce. leather vs pierce = 1.05
      // 10 * 1.05 = 10.5 -> round to 11
      expect(applyArmorTypeMod(10, 'dagger', 'leather')).toBe(11);

      // longsword is slash. plate_mail vs slash = 0.85
      // 10 * 0.85 = 8.5 -> round to 9
      expect(applyArmorTypeMod(10, 'longsword', 'plate_mail')).toBe(9);

      // mace is bash. scale_mail has no bash mod -> defaults to 1.0
      expect(applyArmorTypeMod(10, 'mace', 'scale_mail')).toBe(10);
    });
  });

  describe('applyFlatMitigation', () => {
    let getItemByIdSpy: any;

    beforeEach(() => {
      getItemByIdSpy = vi.spyOn(equipmentUtils, 'getItemById').mockImplementation((id: string) => {
        if (id === 'plate_armor') return { mitigation: 10 } as any;
        if (id === 'leather') return { mitigation: 2 } as any;
        if (id === 'full_helm') return { mitigation: 5 } as any;
        return undefined;
      });
    });

    afterEach(() => {
      getItemByIdSpy.mockRestore();
    });

    it('returns 0 if incoming damage is 0 or less', () => {
      expect(applyFlatMitigation(0, 'leather', 'full_helm')).toBe(0);
      expect(applyFlatMitigation(-5, 'leather', 'full_helm')).toBe(0);
    });

    it('subtracts total mitigation from damage', () => {
      // plate_armor (10) + full_helm (5) = 15 mitigation
      // 20 - 15 = 5
      expect(applyFlatMitigation(20, 'plate_armor', 'full_helm')).toBe(5);

      // Only armor: leather (2)
      // 10 - 2 = 8
      expect(applyFlatMitigation(10, 'leather', undefined)).toBe(8);
    });

    it('floors damage at 1 if base damage > 0', () => {
      // plate_armor (10) + full_helm (5) = 15 mitigation.
      // 10 damage - 15 mitigation = -5. Floors to 1.
      expect(applyFlatMitigation(10, 'plate_armor', 'full_helm')).toBe(1);
    });

    it('handles missing items correctly', () => {
        // missing/invalid items should return undefined mitigation (0)
        expect(applyFlatMitigation(10, 'unknown_armor', 'unknown_helm')).toBe(10);
    });
  });
});
