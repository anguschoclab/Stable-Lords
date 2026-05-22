import { describe, it, expect } from 'vitest';
import { updatePromoterHistory } from '@/engine/promoters';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { PromoterId, FightId } from '@/types/shared.types';

describe('updatePromoterHistory', () => {
  it('updates totalPursePaid and adds a notable bout', () => {
    const state = createFreshState('test-seed');
    const promoterId = 'test-promoter' as PromoterId;
    const boutId = 'bout-1' as FightId;
    const purse = 500;

    // Manually add a promoter to the state for testing
    state.promoters[promoterId] = {
      id: promoterId,
      name: 'Test Promoter',
      age: 40,
      personality: 'Greedy',
      tier: 'Local',
      capacity: 10,
      biases: [],
      history: {
        totalPursePaid: 1000,
        notableBouts: ['old-bout' as FightId],
        legacyFame: 0,
      },
    };

    const newState = updatePromoterHistory(state, promoterId, purse, boutId);

    expect(newState.promoters[promoterId].history.totalPursePaid).toBe(1500);
    expect(newState.promoters[promoterId].history.notableBouts).toEqual(['old-bout' as FightId, boutId]);
  });

  it('keeps only the last 10 notable bouts', () => {
    const state = createFreshState('test-seed');
    const promoterId = 'test-promoter' as PromoterId;

    const initialBouts = Array.from({ length: 10 }, (_, i) => `bout-${i}` as FightId);

    state.promoters[promoterId] = {
      id: promoterId,
      name: 'Test Promoter',
      age: 40,
      personality: 'Greedy',
      tier: 'Local',
      capacity: 10,
      biases: [],
      history: {
        totalPursePaid: 1000,
        notableBouts: initialBouts,
        legacyFame: 0,
      },
    };

    const newBoutId = 'new-bout' as FightId;
    const newState = updatePromoterHistory(state, promoterId, 100, newBoutId);

    const notableBouts = newState.promoters[promoterId].history.notableBouts;
    expect(notableBouts.length).toBe(10);
    expect(notableBouts[9]).toBe(newBoutId);
    expect(notableBouts).not.toContain('bout-0' as FightId);
    expect(notableBouts).toContain('bout-1' as FightId);
  });

  it('returns original state if promoter does not exist', () => {
    const state = createFreshState('test-seed');
    const newState = updatePromoterHistory(state, 'non-existent' as PromoterId, 100, 'bout-1' as FightId);
    expect(newState).toBe(state);
  });

  it('does not mutate the original state', () => {
    const state = createFreshState('test-seed');
    const promoterId = 'test-promoter' as PromoterId;
    state.promoters[promoterId] = {
      id: promoterId,
      name: 'Test Promoter',
      age: 40,
      personality: 'Greedy',
      tier: 'Local',
      capacity: 10,
      biases: [],
      history: {
        totalPursePaid: 1000,
        notableBouts: [],
        legacyFame: 0,
      },
    };

    const newState = updatePromoterHistory(state, promoterId, 500, 'bout-1' as FightId);

    expect(state.promoters[promoterId].history.totalPursePaid).toBe(1000);
    expect(newState.promoters[promoterId].history.totalPursePaid).toBe(1500);
    expect(newState).not.toBe(state);
    expect(newState.promoters).not.toBe(state.promoters);
    expect(newState.promoters[promoterId]).not.toBe(state.promoters[promoterId]);
  });
});
