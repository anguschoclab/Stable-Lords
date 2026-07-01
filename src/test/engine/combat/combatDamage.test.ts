import { describe, it, expect, vi } from 'vitest';
import {
  protectCovers,
  rollHitLocation,
  applyProtectMod,
  computeHitDamage,
  applyArmorTypeMod,
  HIT_LOCATIONS,
} from '@/engine/combat/mechanics/combatDamage';

describe('combatDamage engine', () => {
  describe('protectCovers', () => {
    it('returns empty array for no protection', () => {
      expect(protectCovers()).toEqual([]);
      expect(protectCovers('none_armor')).toEqual([]);
    });

    it('returns chest and abdomen for body armor', () => {
      const bodyArmors = ['leather', 'chain_mail', 'plate_mail'];
      bodyArmors.forEach((armor) => {
        expect(protectCovers(armor)).toEqual(['chest', 'abdomen']);
      });
    });

    it('returns head for head protection', () => {
      const headArmors = ['leather_cap', 'steel_cap', 'helm', 'full_helm'];
      headArmors.forEach((armor) => {
        expect(protectCovers(armor)).toEqual(['head']);
      });
    });

    it('returns empty array for unknown protection', () => {
      expect(protectCovers('unknown')).toEqual([]);
    });
  });

  describe('rollHitLocation', () => {
    it('returns target if rng < TARGET_HIT_CHANCE', () => {
      const rng = vi.fn().mockReturnValue(0.5); // < 0.6
      const result = rollHitLocation(rng, 'head');
      expect(result).toBe('head');
      expect(rng).toHaveBeenCalledTimes(1);
    });

    it("ignores target 'any'", () => {
      const rng = vi.fn().mockReturnValue(0.1);
      // If it didn't ignore "any", it would return "any" (which is not a HitLocation)
      // but the logic skips the target check if target === "any"
      const result = rollHitLocation(rng, 'any');
      expect(HIT_LOCATIONS).toContain(result);
    });

    it('falls through to random when targeted hit fails (rng >= 0.6)', () => {
      // First call for target check: 0.7 (fail)
      // Second call for exposed location check: 0.4 (fail)
      // Third call for random location index: 0
      const rng = vi.fn().mockReturnValueOnce(0.7).mockReturnValueOnce(0.4).mockReturnValueOnce(0);

      const result = rollHitLocation(rng, 'head');
      expect(result).toBe(HIT_LOCATIONS[0]);
    });

    it('prefers exposed locations when rng < 0.3 after missing target', () => {
      // Target: head
      // Protect: helm (covers head)
      // Exposed: everything except head

      // 1. Target check: 0.7 (fail)
      // 2. Exposed check: 0.2 (success)
      // 3. Exposed index: 0
      const rng = vi.fn().mockReturnValueOnce(0.7).mockReturnValueOnce(0.2).mockReturnValueOnce(0);

      const result = rollHitLocation(rng, 'head', 'helm');
      const covered = protectCovers('helm');
      const exposed = HIT_LOCATIONS.filter((l) => !covered.includes(l));

      expect(result).toBe(exposed[0]);
      expect(covered).toContain('head');
      expect(result).not.toBe('head');
    });

    it('falls back to completely random if no target and rng >= 0.3 for exposed', () => {
      // 1. Exposed check: 0.4 (fail)
      // 2. Random index: 0
      const rng = vi.fn().mockReturnValueOnce(0.4).mockReturnValueOnce(0);

      const result = rollHitLocation(rng);
      expect(result).toBe(HIT_LOCATIONS[0]);
    });
  });

  describe('applyProtectMod', () => {
    it('applies penalty if no protection is provided', () => {
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, 'head')).toBe(110);
      expect(applyProtectMod(100, 'chest', undefined)).toBe(110);
    });

    it("applies penalty if protection is 'none_armor'", () => {
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, 'head', 'none_armor')).toBe(110);
    });

    it('applies reduction if location is covered by protection', () => {
      // leather covers chest and abdomen
      // 100 * 0.75 = 75
      expect(applyProtectMod(100, 'chest', 'leather')).toBe(75);
      expect(applyProtectMod(100, 'abdomen', 'plate_mail')).toBe(75);

      // helm covers head
      expect(applyProtectMod(100, 'head', 'helm')).toBe(75);
    });

    it('applies penalty if location is NOT covered by protection', () => {
      // leather does NOT cover head or arms
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, 'head', 'leather')).toBe(110);
      expect(applyProtectMod(100, 'right arm', 'chain_mail')).toBe(110);

      // helm does NOT cover chest
      expect(applyProtectMod(100, 'chest', 'helm')).toBe(110);
    });

    it('correctly applies Math.floor to ensure integer damage values', () => {
      // Reduction: 10 * 0.75 = 7.5 -> Math.floor -> 7
      expect(applyProtectMod(10, 'chest', 'leather')).toBe(7);

      // Penalty: 11 * 1.1 = 12.1 -> Math.floor -> 12
      expect(applyProtectMod(11, 'head', 'leather')).toBe(12);

      // Penalty with no armor: 15 * 1.1 = 16.5 -> Math.floor -> 16
      expect(applyProtectMod(15, 'right leg')).toBe(16);
    });

    it('handles zero damage correctly', () => {
      expect(applyProtectMod(0, 'head')).toBe(0);
      expect(applyProtectMod(0, 'chest', 'leather')).toBe(0);
    });

    it('handles negative damage correctly (though rare in engine)', () => {
      // -10 * 1.1 = -11
      expect(applyProtectMod(-10, 'head')).toBe(-11);
      // -10 * 0.75 = -7.5 -> Math.floor -> -8
      expect(applyProtectMod(-10, 'chest', 'leather')).toBe(-8);
    });
  });

  describe('computeHitDamage', () => {
    it('applies head multiplier', () => {
      const rng = vi.fn().mockReturnValue(0.5); // average variance (0.85 + 0.5 * 0.3 = 1.0)
      // base = 10 + 4 = 14
      // locMult = 1.5 (head)
      // damage = 14 * 1.5 * 1.0 = 21
      const result = computeHitDamage(rng, 10, 'head');
      expect(result).toBe(21);
    });

    it('applies chest multiplier', () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // base = 14
      // locMult = 1.2 (chest)
      // damage = 14 * 1.2 * 1.0 = 16.8 -> 17
      const result = computeHitDamage(rng, 10, 'chest');
      expect(result).toBe(17);
    });

    it('applies abdomen multiplier', () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // base = 14
      // locMult = 1.1 (abdomen)
      // damage = 14 * 1.1 * 1.0 = 15.4 -> 15
      const result = computeHitDamage(rng, 10, 'abdomen');
      expect(result).toBe(15);
    });

    it('applies limb multiplier', () => {
      const rng = vi.fn().mockReturnValue(0.5);
      // base = 14
      // locMult = 1.0 (limb)
      // damage = 14 * 1.0 * 1.0 = 14
      const result = computeHitDamage(rng, 10, 'right arm');
      expect(result).toBe(14);
    });

    it('respects variance range', () => {
      const baseClass = 10;

      const rngMin = vi.fn().mockReturnValue(0);
      const resMin = computeHitDamage(rngMin, baseClass, 'right arm');
      // 14 * 1.0 * 0.70 = 9.8 -> 10
      expect(resMin).toBe(10);

      const rngMax = vi.fn().mockReturnValue(0.9999);
      const resMax = computeHitDamage(rngMax, baseClass, 'right arm');
      // 14 * 1.0 * 1.30 = 18.2 -> 18
      expect(resMax).toBe(18);
    });

    it('minimum damage is 1', () => {
      const rng = vi.fn().mockReturnValue(0);
      const result = computeHitDamage(rng, -10, 'right arm');
      // base = -10 + 2 = -8
      // even with negative base, min is 1
      expect(result).toBe(1);
    });
  });

  describe('applyArmorTypeMod — armor ID corrections (Bug 2)', () => {
    it('padded armor resists bash damage', () => {
      // mace → bash; padded: { bash: 0.9 } → floor(100 * 0.9) = 90
      expect(applyArmorTypeMod(100, 'mace', 'padded')).toBe(90);
    });

    it('padded armor is weak to pierce damage', () => {
      // dagger → pierce; padded: { pierce: 1.05 } → floor(100 * 1.05) = 105
      expect(applyArmorTypeMod(100, 'dagger', 'padded')).toBe(105);
    });

    it('studded_leather armor resists slash damage', () => {
      // longsword → slash; studded_leather: { slash: 0.88 } → floor(100 * 0.88) = 88
      expect(applyArmorTypeMod(100, 'longsword', 'studded_leather')).toBe(88);
    });

    it('studded_leather armor is weak to pierce damage', () => {
      // dagger → pierce; studded_leather: { pierce: 1.05 } → floor(100 * 1.05) = 105
      expect(applyArmorTypeMod(100, 'dagger', 'studded_leather')).toBe(105);
    });

    it('plate_armor resists slash damage at least as well as plate_mail', () => {
      // plate_mail: { slash: 0.85 } = 85; plate_armor: { slash: 0.80 } = 80
      const plateMailResult = applyArmorTypeMod(100, 'longsword', 'plate_mail');
      const plateArmorResult = applyArmorTypeMod(100, 'longsword', 'plate_armor');
      expect(plateArmorResult).toBeLessThanOrEqual(plateMailResult);
      expect(plateArmorResult).toBe(80);
    });

    it('plate_armor resists bash damage', () => {
      expect(applyArmorTypeMod(100, 'mace', 'plate_armor')).toBe(80);
    });

    it('plate_armor resists pierce damage', () => {
      expect(applyArmorTypeMod(100, 'dagger', 'plate_armor')).toBe(80);
    });
  });
});
