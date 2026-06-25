import { describe, it, expect } from 'vitest';
import { applyProtectMod, applyShieldZoneMod } from '@/engine/combat/mechanics/protectShield';

describe('protectShield', () => {
  describe('applyProtectMod', () => {
    it('reduces damage by 25% if location is covered', () => {
      // 'leather' covers 'chest' and 'abdomen'
      // 100 * 0.75 = 75
      expect(applyProtectMod(100, 'chest', 'leather')).toBe(75);
    });

    it('increases damage by 10% if location is not covered', () => {
      // 'leather' does not cover 'head'
      // 100 * 1.1 = 110
      expect(applyProtectMod(100, 'head', 'leather')).toBe(110);
    });

    it('increases damage by 10% if protect is undefined', () => {
      expect(applyProtectMod(100, 'head', undefined)).toBe(110);
    });
  });

  describe('applyShieldZoneMod', () => {
    it('returns unmodified damage if coverage is undefined', () => {
      expect(applyShieldZoneMod(100, 'chest', undefined)).toBe(100);
    });

    it('returns unmodified damage if location is not in shield zone', () => {
      // LOW covers legs, not chest
      expect(applyShieldZoneMod(100, 'chest', 'LOW')).toBe(100);
    });

    it('reduces damage by 8% (0.92) for LOW coverage', () => {
      expect(applyShieldZoneMod(100, 'right leg', 'LOW')).toBe(92);
    });

    it('reduces damage by 12% (0.88) for MEDIUM coverage', () => {
      expect(applyShieldZoneMod(100, 'chest', 'MEDIUM')).toBe(88);
    });

    it('reduces damage by 15% (0.85) for HIGH coverage', () => {
      expect(applyShieldZoneMod(100, 'head', 'HIGH')).toBe(85);
    });
  });
});
