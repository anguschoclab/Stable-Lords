import { describe, it, expect } from 'vitest';
import {
  WEAPON_STYLE_SUITABILITY,
  getWeaponSuitability,
  weaponSuitabilityDamageMod,
} from '@/engine/weaponSuitability';
import { WEAPONS } from '@/data/equipment/weapons';
import { FightingStyle } from '@/types/shared.types';

const STYLES = Object.values(FightingStyle);

describe('weaponSuitability', () => {
  describe('getWeaponSuitability', () => {
    it('returns the canonical rating for a known weapon/style', () => {
      // Striking Attack is Well-suited or better to every hand weapon (canon); shields excluded
      const shieldIds = new Set(['small_shield', 'medium_shield', 'large_shield']);
      for (const id of Object.keys(WEAPON_STYLE_SUITABILITY)) {
        if (shieldIds.has(id)) continue;
        expect(['W', 'CW']).toContain(getWeaponSuitability(id, FightingStyle.StrikingAttack));
      }
      // Dagger is Unorthodox for Bashing, Well-suited for Aimed Blow
      expect(getWeaponSuitability('dagger', FightingStyle.BashingAttack)).toBe('U');
      expect(getWeaponSuitability('dagger', FightingStyle.AimedBlow)).toBe('W');
    });

    it("marks each style favorite as CW (Can't-go-Wrong)", () => {
      // The classic favorite weapon for each style is the top tier
      expect(getWeaponSuitability('broadsword', FightingStyle.StrikingAttack)).toBe('CW');
      expect(getWeaponSuitability('mace', FightingStyle.BashingAttack)).toBe('CW');
      expect(getWeaponSuitability('scimitar', FightingStyle.SlashingAttack)).toBe('CW');
      expect(getWeaponSuitability('quarterstaff', FightingStyle.AimedBlow)).toBe('CW');
      expect(getWeaponSuitability('morning_star', FightingStyle.WallOfSteel)).toBe('CW');
      expect(getWeaponSuitability('medium_shield', FightingStyle.TotalParry)).toBe('CW');
    });

    it('rates shields too (Total-Parry loves a shield, Aimed Blow does not)', () => {
      expect(getWeaponSuitability('large_shield', FightingStyle.TotalParry)).toBe('CW');
      expect(getWeaponSuitability('large_shield', FightingStyle.AimedBlow)).toBe('U');
    });

    it('defaults to Marginal for unknown ids', () => {
      expect(getWeaponSuitability('not_a_weapon', FightingStyle.StrikingAttack)).toBe('M');
      expect(getWeaponSuitability(undefined, FightingStyle.StrikingAttack)).toBe('M');
    });
  });

  describe('weaponSuitabilityDamageMod', () => {
    it('maps CW/W/M/U to +1/0/-1/-2', () => {
      expect(weaponSuitabilityDamageMod('CW')).toBe(1);
      expect(weaponSuitabilityDamageMod('W')).toBe(0);
      expect(weaponSuitabilityDamageMod('M')).toBe(-1);
      expect(weaponSuitabilityDamageMod('U')).toBe(-2);
    });
  });

  describe('matrix integrity', () => {
    it('rates every weapon for all 10 styles', () => {
      for (const w of WEAPONS) {
        expect(WEAPON_STYLE_SUITABILITY[w.id], `missing suitability row for ${w.id}`).toBeDefined();
        for (const style of STYLES) {
          expect(['CW', 'W', 'M', 'U']).toContain(getWeaponSuitability(w.id, style));
        }
      }
    });

    it('every favored (CW) pairing is also in preferredStyles (CW ⊆ W)', () => {
      for (const w of WEAPONS) {
        const preferred = new Set(w.preferredStyles ?? []);
        for (const style of w.favoredStyles ?? []) {
          expect(preferred.has(style), `${w.id}/${style}: favored must also be preferred`).toBe(
            true
          );
        }
      }
    });

    it('is consistent with weapons.ts favoredStyles (CW) / preferredStyles (W) / restrictedStyles (U)', () => {
      for (const w of WEAPONS) {
        const row = WEAPON_STYLE_SUITABILITY[w.id];
        if (!row) continue;
        const favored = new Set(w.favoredStyles ?? []);
        const preferred = new Set(w.preferredStyles ?? []);
        const restricted = new Set(w.restrictedStyles ?? []);
        for (const style of STYLES) {
          const rating = getWeaponSuitability(w.id, style);
          if (rating === 'CW') {
            expect(favored.has(style), `${w.id}/${style}: CW must be in favoredStyles`).toBe(true);
          } else if (rating === 'W') {
            expect(preferred.has(style), `${w.id}/${style}: W must be in preferredStyles`).toBe(
              true
            );
            expect(favored.has(style), `${w.id}/${style}: W must not be favored`).toBe(false);
            expect(restricted.has(style), `${w.id}/${style}: W must not be restricted`).toBe(false);
          } else if (rating === 'U') {
            expect(restricted.has(style), `${w.id}/${style}: U must be in restrictedStyles`).toBe(
              true
            );
            expect(preferred.has(style), `${w.id}/${style}: U must not be preferred`).toBe(false);
          } else {
            // Marginal: neither preferred nor restricted
            expect(preferred.has(style), `${w.id}/${style}: M must not be preferred`).toBe(false);
            expect(restricted.has(style), `${w.id}/${style}: M must not be restricted`).toBe(false);
          }
        }
      }
    });
  });
});
