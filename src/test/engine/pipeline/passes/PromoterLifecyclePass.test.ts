import { describe, it, expect, beforeEach } from 'vitest';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { populateTestState } from '@/test/_setup/testHelpers';
import type { GameState, Promoter } from '@/types/state.types';
import { FightingStyle } from '@/types/shared.types';
import type { IRNGService } from '@/engine/core/rng/IRNGService';
import { runPromoterLifecyclePass } from '@/engine/pipeline/passes/PromoterLifecyclePass';

function makeMockRng(retireNext: boolean): IRNGService {
  let callCount = 0;
  return {
    next: () => {
      if (callCount === 0) {
        callCount++;
        return retireNext ? 0.0 : 0.99;
      }
      callCount++;
      return 0.5;
    },
    pick: <T>(arr: T[]): T => arr[0]!,
    uuid: () => `mock-uuid-${Math.random()}`,
    roll: () => 5,
    shuffle: <T>(arr: T[]): T[] => arr,
    pickWeighted: <T>(items: T[]): T => items[0]!,
    chance: (p: number) => p > 0,
  } as unknown as IRNGService;
}

function makePromoter(
  id: string,
  name: string,
  age: number,
  personality: Promoter['personality'] = 'Corporate',
  tier: Promoter['tier'] = 'Local',
  capacity: number = 2
): Promoter {
  return {
    id: id as Promoter['id'],
    name,
    age,
    personality,
    tier,
    capacity,
    biases: [FightingStyle.StrikingAttack],
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
  };
}

describe('PromoterLifecyclePass', () => {
  let state: GameState;

  beforeEach(() => {
    state = createFreshState('test-seed');
    state = populateTestState(state);
  });

  describe('aging', () => {
    it('increments promoter age on aging week (week % 52 === 0)', () => {
      state.week = 52;
      (state as any).promoters = {
        p1: makePromoter('p1', 'Promoter One', 45),
      };

      const impact = runPromoterLifecyclePass(state);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;

      expect(updatedPromoters.p1).toBeDefined();
      expect(updatedPromoters.p1!.age).toBe(46);
    });

    it('does not increment age on non-aging weeks', () => {
      state.week = 10;
      (state as any).promoters = {
        p1: makePromoter('p1', 'Promoter One', 45),
      };

      const impact = runPromoterLifecyclePass(state);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;

      expect(updatedPromoters.p1!.age).toBe(45);
    });
  });

  describe('succession', () => {
    it('replaces retired promoter with successor (old ID removed, new ID added)', () => {
      state.week = 52;
      const oldPromoter = makePromoter('p_old', 'Old Promoter', 70);
      (state as any).promoters = { p_old: oldPromoter };

      // finalChance = 0.05 + (70-65)*0.03 = 0.20, legacyBonus = 0
      // Mock RNG returns 0.0 for first next() → triggers retirement
      const rng = makeMockRng(true);
      const impact = runPromoterLifecyclePass(state, rng);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;

      // Old ID should be gone
      expect(updatedPromoters.p_old).toBeUndefined();

      // A new promoter should exist (successor with new ID)
      const newIds = Object.keys(updatedPromoters);
      expect(newIds.length).toBe(1);
      const successor = updatedPromoters[newIds[0]!];
      expect(successor).toBeDefined();
      expect(successor!.name).not.toBe('Old Promoter');
      expect(successor!.age).toBeLessThan(70);
    });

    it('produces newsletter item on succession', () => {
      state.week = 52;
      (state as any).promoters = { p_old: makePromoter('p_old', 'Old Promoter', 70) };

      const rng = makeMockRng(true);
      const impact = runPromoterLifecyclePass(state, rng);

      expect(impact.newsletterItems).toBeDefined();
      expect(impact.newsletterItems!.length).toBeGreaterThan(0);
    });
  });

  describe('no-op cases', () => {
    it('returns unchanged promoters when no aging and no retirement', () => {
      state.week = 10;
      const p1 = makePromoter('p1', 'Promoter One', 30);
      const p2 = makePromoter('p2', 'Promoter Two', 40);
      (state as any).promoters = { p1, p2 };

      const impact = runPromoterLifecyclePass(state);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;

      expect(Object.keys(updatedPromoters).sort()).toEqual(['p1', 'p2']);
      expect(updatedPromoters.p1!.age).toBe(30);
      expect(updatedPromoters.p2!.age).toBe(40);
    });

    it('ages but does not retire promoters under 65', () => {
      state.week = 52;
      (state as any).promoters = {
        p1: makePromoter('p1', 'Promoter One', 50),
      };

      const impact = runPromoterLifecyclePass(state);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;

      expect(updatedPromoters.p1).toBeDefined();
      expect(updatedPromoters.p1!.age).toBe(51);
      expect(impact.newsletterItems).toBeUndefined();
    });
  });

  describe('multiple promoters', () => {
    it('handles multiple promoters with mixed aging and retirement', () => {
      state.week = 52;
      (state as any).promoters = {
        young: makePromoter('young', 'Young Promoter', 30),
        mid: makePromoter('mid', 'Mid Promoter', 50),
        old: makePromoter('old', 'Old Promoter', 70),
      };

      const rng = makeMockRng(true);
      const impact = runPromoterLifecyclePass(state, rng);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;

      // Young and mid should still be present with incremented age
      expect(updatedPromoters.young).toBeDefined();
      expect(updatedPromoters.young!.age).toBe(31);
      expect(updatedPromoters.mid).toBeDefined();
      expect(updatedPromoters.mid!.age).toBe(51);

      // Old should be replaced (old ID gone, new ID present)
      expect(updatedPromoters.old).toBeUndefined();
      const allIds = Object.keys(updatedPromoters);
      expect(allIds.length).toBe(3);
    });

    it('handles multiple successive retirements in single pass (Object.entries snapshot)', () => {
      state.week = 52;
      (state as any).promoters = {
        old1: makePromoter('old1', 'Old Promoter 1', 70),
        old2: makePromoter('old2', 'Old Promoter 2', 75),
        old3: makePromoter('old3', 'Old Promoter 3', 80),
      };

      // Mock RNG: always return 0.0 from next() → always triggers retirement
      // (finalChance for age 70 = 0.20, for 75 = 0.35, for 80 = 0.50; all > 0.0)
      let uuidCount = 0;
      const rng: IRNGService = {
        next: () => 0.0,
        pick: <T>(arr: T[]): T => arr[0]!,
        uuid: () => `successor-${++uuidCount}`,
        roll: () => 5,
        shuffle: <T>(arr: T[]): T[] => arr,
        pickWeighted: <T>(items: T[]): T => items[0]!,
        chance: (p: number) => p > 0,
      } as unknown as IRNGService;

      const impact = runPromoterLifecyclePass(state, rng);
      const updatedPromoters = impact.promoters as Record<string, Promoter>;
      const allIds = Object.keys(updatedPromoters);

      // All three old promoters should be retired (old IDs gone)
      expect(updatedPromoters.old1).toBeUndefined();
      expect(updatedPromoters.old2).toBeUndefined();
      expect(updatedPromoters.old3).toBeUndefined();

      // Three new successor IDs should be present
      expect(allIds.length).toBe(3);
      for (const id of allIds) {
        const successor = updatedPromoters[id]!;
        expect(successor).toBeDefined();
        expect(successor.age).toBeLessThan(65);
      }

      // Newsletter should have 3 succession items
      expect(impact.newsletterItems).toBeDefined();
      expect(impact.newsletterItems!.length).toBeGreaterThan(0);
      const allNews = impact.newsletterItems!.flatMap((n) => n.items);
      const successionNews = allNews.filter((s) => s.includes('SUCCESSION'));
      expect(successionNews.length).toBe(3);
    });
  });
});
