import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processTierProgression } from '@/engine/pipeline/core/tierProgression';
import type { GameState, RivalStableData } from '@/types/state.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import type { RivalWarrior } from '@/types/warrior.types';
import type { StableId } from '@/types/shared.types';

describe('TierProgression', () => {
  let mockState: GameState;
  let mockRng: IRNGService;

  beforeEach(() => {
    mockState = {
      season: 1,
      week: 1,
      meta: { createdAt: new Date(0).toISOString() },
      rivals: [],
    } as unknown as GameState;

    mockRng = {
      uuid: vi.fn(() => 'mock-uuid'),
    } as unknown as IRNGService;
  });

  const createRival = (
    id: string,
    tier: RivalStableData['tier'],
    roster: Partial<RivalWarrior>[]
  ): RivalStableData => {
    return {
      id: id as StableId,
      owner: { stableName: `Stable ${id}` },
      tier,
      roster: roster.map((w) => ({
        ...w,
        status: w.status || 'Active',
        career: w.career || { wins: 0, losses: 0, kills: 0, highestRank: 0 },
      })) as RivalWarrior[],
    } as RivalStableData;
  };

  it('should not process progression if season has not changed', () => {
    const impact = processTierProgression(mockState, 1, 1, mockRng);
    expect(impact).toEqual({});
  });

  describe('Minor Tier Rules', () => {
    it('should promote to Established if wins >= 15, kills >= 2, and activeCount >= 5', () => {
      mockState.rivals = [
        createRival('r1', 'Minor', [
          { status: 'Active', career: { wins: 15, kills: 2, losses: 0, highestRank: 0 } },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.get('r1' as StableId)?.tier).toBe('Established');
      expect(impact.newsletterItems?.[0].items[0]).toContain('risen to Established status');
    });

    it('should not promote if conditions are not met', () => {
      mockState.rivals = [
        createRival('r1', 'Minor', [
          { status: 'Active', career: { wins: 14, kills: 2, losses: 0, highestRank: 0 } }, // Insufficient wins
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.size).toBe(0);
      expect(impact.newsletterItems).toBeUndefined();
    });
  });

  describe('Established Tier Rules', () => {
    it('should promote to Major if wins >= 30, kills >= 5, activeCount >= 7, fights > 0, and winRate >= 0.6', () => {
      mockState.rivals = [
        createRival('r2', 'Established', [
          { status: 'Active', career: { wins: 30, kills: 5, losses: 20, highestRank: 0 } }, // winRate = 30/50 = 0.6
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.get('r2' as StableId)?.tier).toBe('Major');
      expect(impact.newsletterItems?.[0].items[0]).toContain('ascends to Major stable status');
    });

    it('should demote to Minor if activeCount < 3', () => {
      mockState.rivals = [
        createRival('r2', 'Established', [
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Retired' }, // Only 2 active
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.get('r2' as StableId)?.tier).toBe('Minor');
      expect(impact.newsletterItems?.[0].items[0]).toContain('falls to Minor status');
    });

    it('should not change tier if neither condition is met', () => {
      mockState.rivals = [
        createRival('r2', 'Established', [
          { status: 'Active', career: { wins: 29, kills: 5, losses: 0, highestRank: 0 } }, // Almost promote
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.size).toBe(0);
    });
  });

  describe('Major Tier Rules', () => {
    it('should demote to Established if activeCount < 4', () => {
      mockState.rivals = [
        createRival('r3', 'Major', [
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Dead' }, // Only 3 active
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.get('r3' as StableId)?.tier).toBe('Established');
      expect(impact.newsletterItems?.[0].items[0]).toContain('downgraded to Established');
    });

    it('should stay Major if activeCount >= 4', () => {
      mockState.rivals = [
        createRival('r3', 'Major', [
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.size).toBe(0);
    });
  });

  describe('Legendary Tier Rules', () => {
    it('should never change tier', () => {
      mockState.rivals = [
        createRival('r4', 'Legendary', [
          { status: 'Retired' }, // No active, doesn't matter
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should default to Minor tier if rival has no tier', () => {
      mockState.rivals = [
        createRival('r_none', undefined as any, [
          { status: 'Active', career: { wins: 15, kills: 2, losses: 0, highestRank: 0 } },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
          { status: 'Active' },
        ]),
      ];

      const impact = processTierProgression(mockState, 2, 1, mockRng);
      expect(impact.rivalsUpdates?.get('r_none' as StableId)?.tier).toBe('Established');
    });

    it('should create an internal RNG service if none provided', () => {
       mockState.rivals = [
        createRival('r1', 'Established', [
          { status: 'Active' },
        ]),
      ];

      // No mock RNG provided
      const impact = processTierProgression(mockState, 2, 1);

      expect(impact.rivalsUpdates?.get('r1' as StableId)?.tier).toBe('Minor');
      expect(impact.newsletterItems?.[0].id).toBeDefined();
    });

    it('should handle undefined rivals list safely', () => {
      delete mockState.rivals;
      const impact = processTierProgression(mockState, 2, 1, mockRng);

      expect(impact.rivalsUpdates?.size).toBe(0);
      expect(impact.newsletterItems).toBeUndefined();
    });
  });
});
