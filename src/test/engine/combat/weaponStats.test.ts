import { describe, it, expect } from 'vitest';
import { weaponDamageBonus, getWeaponInitiativeMod } from '@/engine/combat/mechanics/weaponStats';
import { WEAPONS, SHIELD_ITEM_IDS } from '@/data/equipment/weapons';
import { WEAPON_DAMAGE_TYPE } from '@/engine/combat/mechanics/combatDamage';
import {
  WEAPON_PREFERRED_RANGE,
  WEAPON_RANGE_MODIFIERS,
} from '@/engine/combat/mechanics/distanceResolution';
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

    it('applies the full CW/W/M/U suitability gradient (relative to heft-only base)', () => {
      const base = weaponDamageBonus('broadsword'); // heft only, no style
      // broadsword: CW for Striking, W for Slashing, M for Aimed Blow, U for Lunging
      expect(weaponDamageBonus('broadsword', FightingStyle.StrikingAttack)).toBe(base + 1); // CW
      expect(weaponDamageBonus('broadsword', FightingStyle.SlashingAttack)).toBe(base + 0); // W
      expect(weaponDamageBonus('broadsword', FightingStyle.AimedBlow)).toBe(base - 1); // M
      expect(weaponDamageBonus('broadsword', FightingStyle.LungingAttack)).toBe(base - 2); // U
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

  describe('newly-added canonical weapons', () => {
    it('war hammer hits harder than a neutral weapon and is slower', () => {
      expect(weaponDamageBonus('war_hammer')).toBeGreaterThan(0);
      expect(weaponDamageBonus('war_hammer')).toBeGreaterThan(weaponDamageBonus('longsword'));
      expect(getWeaponInitiativeMod('war_hammer')).toBeLessThan(0);
    });

    it('long spear carries a small heft bonus (its real edge is reach, handled by range)', () => {
      expect(weaponDamageBonus('long_spear')).toBeGreaterThan(0);
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

    it('every weapon has a damage type mapping (wiring guard)', () => {
      for (const w of WEAPONS) {
        expect(WEAPON_DAMAGE_TYPE[w.id], `missing WEAPON_DAMAGE_TYPE for ${w.id}`).toBeDefined();
      }
    });

    it('every non-shield weapon has a preferred range and range modifiers (wiring guard)', () => {
      const shields = new Set<string>(SHIELD_ITEM_IDS);
      for (const w of WEAPONS) {
        if (shields.has(w.id)) continue;
        expect(
          WEAPON_PREFERRED_RANGE[w.id],
          `missing WEAPON_PREFERRED_RANGE for ${w.id}`
        ).toBeDefined();
        expect(
          WEAPON_RANGE_MODIFIERS[w.id],
          `missing WEAPON_RANGE_MODIFIERS for ${w.id}`
        ).toBeDefined();
      }
    });
  });

  // ─── Phase 4: Edge cases ─────────────────────────────────────────────────────

  describe('weaponDamageBonus edge cases', () => {
    it('fist (weight 0) has negative heft', () => {
      // heft = round((0 - 3) * 0.8) = round(-2.4) = -2
      expect(weaponDamageBonus('fist')).toBe(-2);
    });

    it('CW suitability adds +1 to heft for broadsword + StrikingAttack', () => {
      const heft = weaponDamageBonus('broadsword'); // no style
      expect(weaponDamageBonus('broadsword', FightingStyle.StrikingAttack)).toBe(heft + 1);
    });

    it('undefined style returns heft only (no suitability mod)', () => {
      // broadsword weight = 4, heft = round((4-3)*0.8) = round(0.8) = 1
      expect(weaponDamageBonus('broadsword', undefined)).toBe(1);
    });
  });

  describe('getWeaponInitiativeMod edge cases', () => {
    it('fist (weight 0) has positive initiative', () => {
      // init = -round((0 - 3) * 0.5) = -round(-1.5) = -(-1) = 1
      // Math.round(-1.5) = -1 (rounds toward +Infinity for .5)
      expect(getWeaponInitiativeMod('fist')).toBe(1);
    });

    it('weight-3 weapon (longsword) has zero initiative mod', () => {
      // init = -round((3 - 3) * 0.5) = -round(0) = -0
      expect(getWeaponInitiativeMod('longsword')).toBe(-0);
    });
  });
});
