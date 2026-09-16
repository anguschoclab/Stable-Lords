import { describe, it, expect, vi } from 'vitest';
import { protectCovers, rollHitLocation } from '@/engine/combat/mechanics/hitLocation';

describe('Hit Location', () => {
  describe('protectCovers', () => {
    it('returns empty array for missing/invalid protect', () => {
      expect(protectCovers(undefined)).toEqual([]);
      expect(protectCovers('Any')).toEqual([]);
      expect(protectCovers('none_armor')).toEqual([]);
      expect(protectCovers('none_helm')).toEqual([]);
    });

    it('returns head for helm/cap', () => {
      expect(protectCovers('helm')).toEqual(['head']);
      expect(protectCovers('cap')).toEqual(['head']);
      expect(protectCovers('head')).toEqual(['head']);
    });

    it('returns chest/abdomen for body armor', () => {
      expect(protectCovers('leather')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('padded')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('studded_leather')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('chain_mail')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('plate_armor')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('body')).toEqual(['chest', 'abdomen']);
    });

    it('returns arms for arms', () => {
      expect(protectCovers('arms')).toEqual(['right arm', 'left arm']);
    });

    it('returns legs for legs', () => {
      expect(protectCovers('legs')).toEqual(['right leg', 'left leg']);
    });

    it('returns empty array for unknown protection string', () => {
      expect(protectCovers('unknown_protect_string')).toEqual([]);
    });
  });

  describe('rollHitLocation', () => {
    it('respects targeted hit chance if target is valid and not covered', () => {
      // 0.5 < TARGET_HIT_CHANCE (0.7) -> hits target
      const rng = vi.fn().mockReturnValue(0.5);
      expect(rollHitLocation(rng, 'head', 'none')).toBe('head');
    });

    it('respects targeted miss chance if target is valid and covered', () => {
      // TARGET_MISS_CHANCE is 0.3
      // 0.2 < 0.3 -> hits target despite cover
      const rngHit = vi.fn().mockReturnValue(0.2);
      expect(rollHitLocation(rngHit, 'chest', 'leather')).toBe('chest');

      // 0.5 > 0.3 -> misses target due to cover, falls through to exposed/random logic
      // Next rng call for exposed is < 0.3, so it picks exposed.
      // 'chest' and 'abdomen' are covered by 'leather', leaving 5 exposed parts.
      const rngMiss = vi
        .fn()
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.0);
      // Exposed array: ['head', 'right arm', 'left arm', 'right leg', 'left leg']
      // Pick index 0 -> 'head'
      expect(rollHitLocation(rngMiss, 'chest', 'leather')).toBe('head');
    });

    it('picks exposed area if not targeting and rng < 0.3', () => {
      // 0.2 < 0.3 -> hits exposed area
      const rng = vi.fn().mockReturnValueOnce(0.2).mockReturnValueOnce(0.0);
      // Covered 'head', exposed array length = 6. Pick index 0 -> 'chest'
      expect(rollHitLocation(rng, 'Any', 'helm')).toBe('chest');
    });

    it('picks completely random location if rng >= 0.3 and no valid target', () => {
      // 0.5 >= 0.3 -> hits random area
      // Next roll picks index 0 -> 'head'
      const rng = vi.fn().mockReturnValueOnce(0.5).mockReturnValueOnce(0.0);
      expect(rollHitLocation(rng, 'Any', 'none')).toBe('head');
    });

    it('picks exposed area when target is invalid', () => {
      // Invalid target string 'invalid' -> ignored
      // 0.2 < 0.3 -> hits exposed area
      const rng = vi.fn().mockReturnValueOnce(0.2).mockReturnValueOnce(0.0);
      // Covered nothing, exposed array length = 7. Pick index 0 -> 'head'
      expect(rollHitLocation(rng, 'invalid', 'none')).toBe('head');
    });
  });
});
