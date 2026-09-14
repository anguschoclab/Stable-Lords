import { describe, it, expect } from 'vitest';
import { applyProtectMod, applyShieldZoneMod } from '@/engine/combat/mechanics/protectShield';

describe('Protect & Shield Mechanics', () => {
  describe('applyProtectMod', () => {
    it('applies reduction if protect covers the hit location', () => {
      // leather covers chest
      // 10 * 0.75 = 7.5 -> floor to 7
      expect(applyProtectMod(10, 'chest', 'leather')).toBe(7);
    });

    it('applies penalty if protect does not cover the hit location', () => {
      // leather does NOT cover head
      // 10 * 1.1 = 11 -> floor to 11
      expect(applyProtectMod(10, 'head', 'leather')).toBe(11);
    });

    it('applies penalty if protect is undefined', () => {
      // 10 * 1.1 = 11
      expect(applyProtectMod(10, 'head', undefined)).toBe(11);
    });
  });

  describe('applyShieldZoneMod', () => {
    it('returns original damage if coverage is missing', () => {
      expect(applyShieldZoneMod(10, 'chest', undefined)).toBe(10);
    });

    it('returns original damage if zone does not cover hit location', () => {
      // LOW zone does NOT cover head
      expect(applyShieldZoneMod(10, 'head', 'LOW')).toBe(10);
    });

    it('applies mitigation if zone covers hit location', () => {
      // LOW zone covers right leg (0.92 mitigation)
      // 10 * 0.92 = 9.2 -> floor to 9
      expect(applyShieldZoneMod(10, 'right leg', 'LOW')).toBe(9);

      // MEDIUM zone covers chest (0.88 mitigation)
      // 10 * 0.88 = 8.8 -> floor to 8
      expect(applyShieldZoneMod(10, 'chest', 'MEDIUM')).toBe(8);

      // HIGH zone covers head (0.85 mitigation)
      // 10 * 0.85 = 8.5 -> floor to 8
      expect(applyShieldZoneMod(10, 'head', 'HIGH')).toBe(8);
    });
  });
});
