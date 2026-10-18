// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useBookingOffice } from '@/pages/BookingOffice/hooks/useBookingOffice';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior, makeBoutOffer } from '@/test/_fixtures/factories';
import type { GameState, Promoter, Warrior, BoutOffer } from '@/types/state.types';
import type { WarriorId, PromoterId, BoutOfferId } from '@/types/shared.types';
import '@/test/_setup/setup';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const warrior = (id: string, overrides: Partial<Warrior> = {}) =>
  makeWarrior({ id: id as WarriorId, name: id, fatigue: 0, injuries: [], ...overrides } as any);

const offer = (id: string, warriorIds: WarriorId[], boutWeek = 2): BoutOffer =>
  makeBoutOffer({
    id: id as BoutOfferId,
    promoterId: 'p1' as PromoterId,
    warriorIds,
    boutWeek,
    expirationWeek: 1,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: {},
  } as any);

const promoter = (personality: Promoter['personality']): Promoter =>
  ({
    id: 'p1' as PromoterId,
    name: 'Promoter',
    age: 45,
    personality,
    tier: 'Local',
    capacity: 5,
    biases: [],
    history: { totalPursePaid: 0, notableBouts: [], legacyFame: 0 },
  }) as Promoter;

function loadState(overrides: Partial<GameState>) {
  const fresh = createFreshState('booking-test');
  Object.assign(fresh, {
    week: 1,
    absoluteWeek: 1,
    boutOffers: {},
    promoters: {},
    roster: [],
    rivals: [],
    ...overrides,
  });
  useGameStore.getState().loadGame('booking-test', fresh);
}

describe('useBookingOffice', () => {
  beforeEach(() => {
    loadState({});
  });

  it('accepts an offer immediately and writes the player response to the offer', () => {
    const w1 = warrior('w1');
    loadState({
      roster: [w1],
      promoters: { ['p1' as PromoterId]: promoter('Honorable') },
      boutOffers: { ['o1' as BoutOfferId]: offer('o1', ['w1' as WarriorId]) },
    });

    const { result } = renderHook(() => useBookingOffice());
    act(() => result.current.handleResponse('o1', 'w1', 'Accepted'));

    const saved = useGameStore.getState().boutOffers['o1' as BoutOfferId]!;
    expect(saved.responses['w1' as WarriorId]).toBe('Accepted');
    expect(saved.status).toBe('Signed');
    expect(result.current.signedOfferIds.has('o1')).toBe(true);
  });

  it('declines an offer immediately without inventing a draft state', () => {
    const w1 = warrior('w1');
    loadState({
      roster: [w1],
      promoters: { ['p1' as PromoterId]: promoter('Honorable') },
      boutOffers: { ['o1' as BoutOfferId]: offer('o1', ['w1' as WarriorId]) },
    });

    const { result } = renderHook(() => useBookingOffice());
    act(() => result.current.handleResponse('o1', 'w1', 'Declined'));

    const saved = useGameStore.getState().boutOffers['o1' as BoutOfferId]!;
    expect(saved.responses['w1' as WarriorId]).toBe('Declined');
    expect(saved.status).toBe('Rejected');
    expect(result.current.signedOfferIds.has('o1')).toBe(false);
  });

  it('batch-accepts only honorable offers for healthy, non-exhausted warriors', () => {
    const healthy = warrior('healthy');
    const tired = warrior('tired', { fatigue: 80 });
    const hurt = warrior('hurt', {
      injuries: [
        {
          id: 'injury-1',
          name: 'Broken Rib',
          description: '',
          severity: 'Severe',
          weeksRemaining: 2,
          penalties: {},
        } as any,
      ],
    });
    loadState({
      roster: [healthy, tired, hurt],
      promoters: { ['p1' as PromoterId]: promoter('Honorable') },
      boutOffers: {
        ['o1' as BoutOfferId]: offer('o1', ['healthy' as WarriorId]),
        ['o2' as BoutOfferId]: offer('o2', ['tired' as WarriorId]),
        ['o3' as BoutOfferId]: offer('o3', ['hurt' as WarriorId]),
      },
    });

    const { result } = renderHook(() => useBookingOffice());
    act(() => result.current.acceptAllHonorable());

    const offers = useGameStore.getState().boutOffers;
    expect(offers['o1' as BoutOfferId]?.responses['healthy' as WarriorId]).toBe('Accepted');
    expect(offers['o2' as BoutOfferId]?.responses['tired' as WarriorId]).toBeUndefined();
    expect(offers['o3' as BoutOfferId]?.responses['hurt' as WarriorId]).toBeUndefined();
  });
});
