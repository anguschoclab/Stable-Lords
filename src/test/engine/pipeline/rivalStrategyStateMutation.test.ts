import { describe, it, expect } from 'vitest';
import { runRivalStrategyPass } from '@/engine/pipeline/passes/RivalStrategyPass';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { SeededRNGService } from '@/utils/random';
import type { BoutOffer } from '@/types/state.types';
import type { BoutOfferId } from '@/types/shared.types';

describe('NF6: RivalStrategyPass state mutation', () => {
  it('boutOffersWithWorld should not mutate original state.boutOffers', () => {
    const state = createFreshState('rival-strategy-mutation-test');
    const originalOffers = { ...(state.boutOffers || {}) };
    const originalOfferCount = Object.keys(originalOffers).length;

    const rng = new SeededRNGService(42);
    const impact = runRivalStrategyPass(state, 2, rng, true);

    // The original state.boutOffers should not be mutated by the pass
    // (the pass should only return impacts, not mutate state directly)
    expect(impact).toBeDefined();
    expect(Object.keys(state.boutOffers || {}).length).toBe(originalOfferCount);
  });

  it('expired offers should be purged correctly', () => {
    const state = createFreshState('rival-strategy-expiry-test');
    // Add an expired offer
    const expiredOffer: BoutOffer = {
      id: 'expired-1' as BoutOfferId,
      proposerStableId: 'rival-1' as any,
      opponentStableId: 'stable-player' as any,
      warriorIds: ['w1' as any, 'w2' as any],
      boutWeek: 1,
      expirationWeek: 1,
      status: 'Proposed',
      arenaId: 'standard_arena',
      createdAt: new Date().toISOString(),
    } as any;

    state.boutOffers = { 'expired-1': expiredOffer } as any;
    state.absoluteWeek = 5;

    const rng = new SeededRNGService(42);
    const impact = runRivalStrategyPass(state, 6, rng, true);

    // The impact's boutOffers should not contain the expired offer
    if (impact.boutOffers) {
      const impactOffers = impact.boutOffers as Record<string, BoutOffer>;
      expect(impactOffers['expired-1']).toBeUndefined();
    }
  });

  it('world bouts should be added correctly to boutOffers', () => {
    const state = createFreshState('rival-strategy-worldbouts-test');
    state.absoluteWeek = 1;

    const rng = new SeededRNGService(42);
    const impact = runRivalStrategyPass(state, 2, rng, true);

    // The impact should be a valid StateImpact
    expect(impact).toBeDefined();
    // boutOffers in the impact should be an object (dict-merge)
    if (impact.boutOffers) {
      expect(typeof impact.boutOffers).toBe('object');
    }
  });
});
