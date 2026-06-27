import { describe, it, expect, vi } from 'vitest';
import { protectCovers, rollHitLocation } from '@/engine/combat/mechanics/hitLocation';

describe('hitLocation mechanics', () => {
  describe('protectCovers', () => {
    it('returns empty array for no protection or "Any" or none_*', () => {
      expect(protectCovers(undefined)).toEqual([]);
      expect(protectCovers()).toEqual([]);
      expect(protectCovers('Any')).toEqual([]);
      expect(protectCovers('none_armor')).toEqual([]);
      expect(protectCovers('none_helm')).toEqual([]);
    });

    it('returns head for helm, cap, or head', () => {
      expect(protectCovers('iron_helm')).toEqual(['head']);
      expect(protectCovers('steel_helm')).toEqual(['head']);
      expect(protectCovers('leather_cap')).toEqual(['head']);
      expect(protectCovers('head')).toEqual(['head']);
    });

    it('returns chest and abdomen for body armor', () => {
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

    it('returns empty array for unknown protection types', () => {
      expect(protectCovers('unknown')).toEqual([]);
      expect(protectCovers('magic_shield')).toEqual([]);
    });
  });

  describe('rollHitLocation', () => {
    // TARGET_HIT_CHANCE = 0.7, TARGET_MISS_CHANCE = 0.3

    it('hits target if not covered and rng < 0.7', () => {
      const rng = vi.fn().mockReturnValue(0.69);
      expect(rollHitLocation(rng, 'head', 'none_helm')).toBe('head');
    });

    it('misses target if not covered and rng >= 0.7', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.7) // Misses target
        .mockReturnValueOnce(0.4) // Doesn't aim for exposed
        .mockReturnValueOnce(0.0); // Picks first from all ('head')
      expect(rollHitLocation(rng, 'chest', 'none_armor')).toBe('head');
    });

    it('hits target if covered and rng < 0.3', () => {
      const rng = vi.fn().mockReturnValue(0.29);
      expect(rollHitLocation(rng, 'head', 'iron_helm')).toBe('head');
    });

    it('misses target if covered and rng >= 0.3', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.3) // Misses target
        .mockReturnValueOnce(0.4) // Doesn't aim for exposed
        .mockReturnValueOnce(0.0); // Picks first from all ('head')
      expect(rollHitLocation(rng, 'chest', 'leather')).toBe('head');
    });

    it('ignores invalid targets', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.0) // rng < 0.3, aims for exposed
        .mockReturnValueOnce(0.0); // Picks first exposed ('head')
      expect(rollHitLocation(rng, 'invalid_target', 'none_armor')).toBe('head');
    });

    it('aims for exposed if rng < 0.3 and misses target', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.2) // aims for exposed
        .mockReturnValueOnce(0.0); // picks first exposed (head, since head is not covered by leather)
      expect(rollHitLocation(rng, undefined, 'leather')).toBe('head');
    });

    it('ignores exposed if all are covered (impossible in game, but testable)', () => {
      const rngFallback = vi.fn()
        .mockReturnValueOnce(0.4) // Doesn't aim for exposed
        .mockReturnValueOnce(0.0); // Picks first from all
      expect(rollHitLocation(rngFallback, undefined, 'none_armor')).toBe('head');
    });

    it('picks randomly from all if target missed and not aiming for exposed', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.4) // Doesn't aim for exposed
        .mockReturnValueOnce(0.99); // Picks last from all ('left leg')
      expect(rollHitLocation(rng, undefined, 'none_armor')).toBe('left leg');
    });

    it('hits target if rng roll is within hit chance (uncovered) - test-smith', () => {
      const rng = vi.fn().mockReturnValue(0.5); // < 0.7
      expect(rollHitLocation(rng, 'head', 'none_helm')).toBe('head');
    });

    it('misses target and falls back if rng roll is outside hit chance (uncovered) - test-smith', () => {
      // First roll for hit chance (0.8 > 0.7) -> misses target
      // Second roll for exposed check (0.8 > 0.3) -> misses exposed
      // Third roll for random location: 0.8 * 7 = 5.6 -> floor(5.6) = 5 -> 'right leg'
      const rng = vi.fn().mockReturnValue(0.8);
      expect(rollHitLocation(rng, 'head', 'none_helm')).toBe('right leg');
    });

    it('hits target but with lower chance if target is covered - test-smith', () => {
      const hitRng = vi.fn().mockReturnValue(0.2); // < 0.3
      expect(rollHitLocation(hitRng, 'head', 'head')).toBe('head');

      // Misses target because covered (0.5 > 0.3)
      // Second roll: 0.5 > 0.3 -> misses exposed check
      // Third roll: 0.5 * 7 = 3.5 -> floor(3.5) = 3 -> 'right arm'
      const missRng = vi.fn().mockReturnValue(0.5);
      expect(rollHitLocation(missRng, 'head', 'head')).toBe('right arm');
    });

    it('targets exposed locations if target is missed and rng < 0.3 - test-smith', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.9) // misses target
        .mockReturnValueOnce(0.2) // exposed check (< 0.3)
        .mockReturnValueOnce(0.5); // selects from exposed

      // covered: head
      // exposed length: 6 (chest, abdomen, right arm, left arm, right leg, left leg)
      // index: floor(0.5 * 6) = 3 -> 'left arm'
      expect(rollHitLocation(rng, 'head', 'head')).toBe('left arm');
    });

    it('defaults to fully random location if no target or target missed, and exposed check missed - test-smith', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.8) // > 0.3 exposed check
        .mockReturnValueOnce(0.5); // random from all locations

      // index: floor(0.5 * 7) = 3 -> 'right arm'
      expect(rollHitLocation(rng)).toBe('right arm');
    });

    it('handles Any target as no specific target - test-smith', () => {
      const rng = vi.fn()
        .mockReturnValueOnce(0.8) // > 0.3 exposed check
        .mockReturnValueOnce(0.5); // random from all locations

      expect(rollHitLocation(rng, 'Any')).toBe('right arm');
    });
  });
});
