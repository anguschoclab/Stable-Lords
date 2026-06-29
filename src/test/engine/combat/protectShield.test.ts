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

  // ─── Phase 4: Edge cases & boundary tests ────────────────────────────────────

  describe('applyProtectMod edge cases', () => {
    it('returns 0 for damage = 0 on covered location', () => {
      expect(applyProtectMod(0, 'chest', 'leather')).toBe(0);
    });

    it('returns 0 for damage = 0 on uncovered location', () => {
      expect(applyProtectMod(0, 'head', 'leather')).toBe(0);
    });

    it('returns 0 for damage = 1 on covered location (Math.floor(0.75) = 0)', () => {
      expect(applyProtectMod(1, 'chest', 'leather')).toBe(0);
    });

    it('returns 1 for damage = 1 on uncovered location (Math.floor(1.1) = 1)', () => {
      expect(applyProtectMod(1, 'head', 'leather')).toBe(1);
    });

    it('covers head location with helm protection', () => {
      expect(applyProtectMod(100, 'head', 'helm')).toBe(75);
    });

    it('Math.floor rounding edge: damage = 3 covered → floor(2.25) = 2', () => {
      expect(applyProtectMod(3, 'chest', 'leather')).toBe(2);
    });

    it('Math.floor rounding edge: damage = 3 uncovered → floor(3.3) = 3', () => {
      expect(applyProtectMod(3, 'head', 'leather')).toBe(3);
    });
  });

  describe('applyShieldZoneMod edge cases', () => {
    it('returns 0 for damage = 0', () => {
      expect(applyShieldZoneMod(0, 'chest', 'MEDIUM')).toBe(0);
    });

    it('covers all MEDIUM zone locations', () => {
      expect(applyShieldZoneMod(100, 'chest', 'MEDIUM')).toBe(88);
      expect(applyShieldZoneMod(100, 'abdomen', 'MEDIUM')).toBe(88);
      expect(applyShieldZoneMod(100, 'right arm', 'MEDIUM')).toBe(88);
      expect(applyShieldZoneMod(100, 'left arm', 'MEDIUM')).toBe(88);
    });

    it('covers all HIGH zone locations', () => {
      expect(applyShieldZoneMod(100, 'head', 'HIGH')).toBe(85);
      expect(applyShieldZoneMod(100, 'chest', 'HIGH')).toBe(85);
      expect(applyShieldZoneMod(100, 'right arm', 'HIGH')).toBe(85);
      expect(applyShieldZoneMod(100, 'left arm', 'HIGH')).toBe(85);
    });

    it('covers left leg for LOW zone', () => {
      expect(applyShieldZoneMod(100, 'left leg', 'LOW')).toBe(92);
    });
  });
});
