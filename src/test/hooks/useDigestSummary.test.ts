// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDigestSummary } from '@/hooks/useDigestSummary';
import type { FightSummary, WarriorId } from '@/types/game';
import type { BoutOffer } from '@/types/state.types';
import type { FightId, BoutOfferId, PromoterId } from '@/types/shared.types';

function makeFight(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'fight-1' as FightId,
    week: 10,
    title: 'Test Fight',
    warriorIdA: 'wa' as WarriorId,
    warriorIdD: 'wd' as WarriorId,
    winner: 'A' as const,
    by: 'KO',
    styleA: 'Brawler',
    styleD: 'Technician',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as FightSummary;
}

function makeOffer(overrides: Partial<BoutOffer> = {}): BoutOffer {
  return {
    id: 'offer-1' as BoutOfferId,
    promoterId: 'promoter-1' as PromoterId,
    warriorIds: ['wa' as WarriorId, 'wd' as WarriorId],
    boutWeek: 10,
    expirationWeek: 11,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses: { 'wa': 'Pending' },
    ...overrides,
  } as BoutOffer;
}

describe('useDigestSummary', () => {
  const playerWarriorIds = new Set<WarriorId>(['wa' as WarriorId, 'wc' as WarriorId]);
  const currentWeek = 10;

  it('returns zeros and tournamentActive false for empty inputs', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current).toEqual({
      totalFights: 0,
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      upcomingBouts: 0,
      pendingOffers: 0,
      signedOffers: 0,
      tournamentActive: false,
    });
  });

  it('counts a player win as A with non-kill outcome', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [makeFight({ winner: 'A', by: 'KO' })],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.wins).toBe(1);
    expect(result.current.kills).toBe(0);
    expect(result.current.losses).toBe(0);
    expect(result.current.deaths).toBe(0);
  });

  it('counts a player win as D with kill outcome', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [
          makeFight({
            winner: 'D',
            by: 'Kill',
            warriorIdA: 'rival-a' as WarriorId,
            warriorIdD: 'wc' as WarriorId,
          }),
        ],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.wins).toBe(1);
    expect(result.current.kills).toBe(1);
  });

  it('counts a player loss as A with non-kill outcome', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [makeFight({ winner: 'D', by: 'Stoppage' })],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.losses).toBe(1);
    expect(result.current.deaths).toBe(0);
  });

  it('counts a player loss as D with kill outcome', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [
          makeFight({
            winner: 'A',
            by: 'Kill',
            warriorIdA: 'rival-a' as WarriorId,
            warriorIdD: 'wc' as WarriorId,
          }),
        ],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.losses).toBe(1);
    expect(result.current.deaths).toBe(1);
  });

  it('ignores draw/null winner', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [makeFight({ winner: null, by: 'Draw' })],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.wins).toBe(0);
    expect(result.current.losses).toBe(0);
    expect(result.current.kills).toBe(0);
    expect(result.current.deaths).toBe(0);
  });

  it('counts non-player fights in totalFights but not in win/loss/kills/deaths', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [
          makeFight({
            winner: 'A',
            by: 'Kill',
            warriorIdA: 'rival-a' as WarriorId,
            warriorIdD: 'rival-d' as WarriorId,
          }),
        ],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.wins).toBe(0);
    expect(result.current.losses).toBe(0);
    expect(result.current.kills).toBe(0);
    expect(result.current.deaths).toBe(0);
  });

  it('filters fights by currentWeek only', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [
          makeFight({ week: 5 }),
          makeFight({ week: 10, winner: 'A', by: 'KO' }),
          makeFight({ week: 15 }),
        ],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(1);
    expect(result.current.wins).toBe(1);
  });

  it('counts Proposed offers with boutWeek >= currentWeek as pending', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {
          'offer-1': makeOffer({ status: 'Proposed', boutWeek: 10 }),
          'offer-2': makeOffer({ status: 'Proposed', boutWeek: 11 }),
          'offer-3': makeOffer({ status: 'Proposed', boutWeek: 9 }),
        },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.pendingOffers).toBe(2);
    expect(result.current.signedOffers).toBe(0);
    expect(result.current.upcomingBouts).toBe(0);
  });

  it('ignores Proposed offers with boutWeek < currentWeek', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {
          'offer-1': makeOffer({ status: 'Proposed', boutWeek: 9 }),
        },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.pendingOffers).toBe(0);
  });

  it('counts Signed offers with boutWeek === currentWeek as signed', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {
          'offer-1': makeOffer({ status: 'Signed', boutWeek: 10 }),
        },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.signedOffers).toBe(1);
    expect(result.current.upcomingBouts).toBe(0);
  });

  it('counts Signed offers with boutWeek > currentWeek as upcoming', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {
          'offer-1': makeOffer({ status: 'Signed', boutWeek: 12 }),
          'offer-2': makeOffer({ status: 'Signed', boutWeek: 15 }),
        },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.signedOffers).toBe(0);
    expect(result.current.upcomingBouts).toBe(2);
  });

  it('ignores Rejected, Canceled, and Expired offers', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {
          r: makeOffer({ status: 'Rejected' }),
          c: makeOffer({ status: 'Canceled' }),
          e: makeOffer({ status: 'Expired' }),
        },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.pendingOffers).toBe(0);
    expect(result.current.signedOffers).toBe(0);
    expect(result.current.upcomingBouts).toBe(0);
  });

  it('returns tournamentActive as false regardless of inputs', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [makeFight()],
        boutOffers: { o1: makeOffer() },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.tournamentActive).toBe(false);
  });

  it('handles a mix of wins, losses, and non-player fights in the same week', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [
          makeFight({ winner: 'A', by: 'Kill' }),
          makeFight({ winner: 'D', by: 'KO' }),
          makeFight({
            winner: 'A',
            by: 'KO',
            warriorIdA: 'rival-a' as WarriorId,
            warriorIdD: 'rival-d' as WarriorId,
          }),
        ],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.totalFights).toBe(3);
    expect(result.current.wins).toBe(1);
    expect(result.current.kills).toBe(1);
    expect(result.current.losses).toBe(1);
    expect(result.current.deaths).toBe(0);
  });

  it('does not count kills when by is null', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [makeFight({ winner: 'A', by: null })],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.wins).toBe(1);
    expect(result.current.kills).toBe(0);
  });

  it('does not count kills when by is Exhaustion', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [makeFight({ winner: 'A', by: 'Exhaustion' })],
        boutOffers: {},
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.wins).toBe(1);
    expect(result.current.kills).toBe(0);
  });

  it('ignores Signed offers with boutWeek < currentWeek', () => {
    const { result } = renderHook(() =>
      useDigestSummary({
        arenaHistory: [],
        boutOffers: {
          'offer-1': makeOffer({ status: 'Signed', boutWeek: 9 }),
        },
        currentWeek,
        playerWarriorIds,
      })
    );
    expect(result.current.signedOffers).toBe(0);
    expect(result.current.upcomingBouts).toBe(0);
    expect(result.current.pendingOffers).toBe(0);
  });
});
