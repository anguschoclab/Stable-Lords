import { describe, it, expect, vi } from 'vitest';
import { protectCovers, rollHitLocation, HIT_LOCATIONS } from '@/engine/combat/mechanics/hitLocation';

describe('hitLocation mechanics', () => {
  describe('protectCovers', () => {
    it('returns empty array for no protection or "Any"', () => {
      expect(protectCovers()).toEqual([]);
      expect(protectCovers('Any')).toEqual([]);
      expect(protectCovers('none_armor')).toEqual([]);
      expect(protectCovers('none_helm')).toEqual([]);
    });

    it('returns head for helm, cap, or head', () => {
      expect(protectCovers('steel_helm')).toEqual(['head']);
      expect(protectCovers('leather_cap')).toEqual(['head']);
      expect(protectCovers('head')).toEqual(['head']);
    });

    it('returns chest and abdomen for body armor', () => {
      expect(protectCovers('leather')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('padded')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('studded_leather')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('plate_armor')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('chain_mail')).toEqual(['chest', 'abdomen']);
      expect(protectCovers('body')).toEqual(['chest', 'abdomen']);
    });

    it('returns arms for arms', () => {
      expect(protectCovers('arms')).toEqual(['right arm', 'left arm']);
    });

    it('returns legs for legs', () => {
      expect(protectCovers('legs')).toEqual(['right leg', 'left leg']);
    });

    it('returns empty array for unknown protection types', () => {
      expect(protectCovers('magic_shield')).toEqual([]);
    });
  });

  describe('rollHitLocation', () => {
    // TARGET_HIT_CHANCE = 0.7, TARGET_MISS_CHANCE = 0.3

    it('hits target if rng roll is within hit chance (uncovered)', () => {
      const rng = vi.fn().mockReturnValue(0.5); // < 0.7
      expect(rollHitLocation(rng, 'head', 'none_helm')).toBe('head');
    });

    it('misses target and falls back if rng roll is outside hit chance (uncovered)', () => {
      // First roll for hit chance (0.8 > 0.7) -> misses target
      // Second roll for exposed check (0.8 > 0.3) -> misses exposed
      // Third roll for random location: 0.8 * 7 = 5.6 -> floor(5.6) = 5 -> 'right leg'
      const rng = vi.fn().mockReturnValue(0.8);
      expect(rollHitLocation(rng, 'head', 'none_helm')).toBe('right leg');
    });

    it('hits target but with lower chance if target is covered', () => {
      const hitRng = vi.fn().mockReturnValue(0.2); // < 0.3
      expect(rollHitLocation(hitRng, 'head', 'head')).toBe('head');

      // Misses target because covered (0.5 > 0.3)
      // Second roll: 0.5 > 0.3 -> misses exposed check
      // Third roll: 0.5 * 7 = 3.5 -> floor(3.5) = 3 -> 'right arm'
      const missRng = vi.fn().mockReturnValue(0.5);
      expect(rollHitLocation(missRng, 'head', 'head')).toBe('right arm');
    });

    it('targets exposed locations if target is missed and rng < 0.3', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.9) // misses target
        .mockReturnValueOnce(0.2) // exposed check (< 0.3)
        .mockReturnValueOnce(0.5); // selects from exposed

      // covered: head
      // exposed length: 6 (chest, abdomen, right arm, left arm, right leg, left leg)
      // index: floor(0.5 * 6) = 3 -> 'left arm'
      expect(rollHitLocation(rng, 'head', 'head')).toBe('left arm');
    });

    it('defaults to fully random location if no target or target missed, and exposed check missed', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.8) // > 0.3 exposed check
        .mockReturnValueOnce(0.5); // random from all locations

      // index: floor(0.5 * 7) = 3 -> 'right arm'
      expect(rollHitLocation(rng)).toBe('right arm');
    });

    it('handles Any target as no specific target', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.8) // > 0.3 exposed check
        .mockReturnValueOnce(0.5); // random from all locations

      expect(rollHitLocation(rng, 'Any')).toBe('right arm');
    });
  });
});
