// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { FightSummary, WarriorId } from '@/types/game';
import type { BoutOffer } from '@/types/state.types';
import type { FightId, BoutOfferId, PromoterId } from '@/types/shared.types';

let mockState: any = {};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

import { WeeklyDigestMini } from '@/components/dashboard/WeeklyDigestMini';

function makeFight(overrides: Partial<FightSummary> = {}): FightSummary {
  return {
    id: 'fight-1' as FightId,
    week: 5,
    absoluteWeek: 5,
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
  const warriorIds = overrides.warriorIds ?? ['wa' as WarriorId];
  const responses = overrides.responses ?? { wa: 'Pending' };
  return {
    id: 'offer-1' as BoutOfferId,
    promoterId: 'promoter-1' as PromoterId,
    warriorIds,
    boutWeek: 5,
    expirationWeek: 6,
    purse: 100,
    hype: 50,
    status: 'Proposed',
    responses,
    ...overrides,
  } as unknown as BoutOffer;
}

function setState(overrides: any = {}) {
  mockState = {
    week: 5,
    absoluteWeek: 5,
    arenaHistory: [],
    boutOffers: {},
    roster: [{ id: 'wa' }, { id: 'wc' }],
    ...overrides,
  };
}

describe('WeeklyDigestMini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setState();
  });

  it('renders week number in badge', () => {
    setState({ week: 7, absoluteWeek: 7 });
    render(<WeeklyDigestMini />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows "No activity" when no fights and no pending offers', () => {
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/No activity/i)).toBeInTheDocument();
  });

  it('shows W/L/K counts when player has fights', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      arenaHistory: [
        makeFight({ id: 'f1' as any, winner: 'A', by: 'Kill' }),
        makeFight({ id: 'f2' as any, winner: 'A', by: 'KO' }),
        makeFight({
          id: 'f3' as any,
          winner: 'A',
          by: 'KO',
          warriorIdA: 'rival-a' as WarriorId,
          warriorIdD: 'wc' as WarriorId,
        }),
      ],
    });
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/W:2/)).toBeInTheDocument();
    expect(screen.getByText(/L:1/)).toBeInTheDocument();
    expect(screen.getByText(/K:1/)).toBeInTheDocument();
  });

  it('shows pending offers count', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      boutOffers: {
        o1: makeOffer({
          id: 'o1' as any,
          status: 'Proposed',
          boutWeek: 5,
          warriorIds: ['wa' as WarriorId],
        }),
        o2: makeOffer({
          id: 'o2' as any,
          status: 'Proposed',
          boutWeek: 5,
          warriorIds: ['wc' as WarriorId],
        }),
        o3: makeOffer({
          id: 'o3' as any,
          status: 'Proposed',
          boutWeek: 6,
          warriorIds: ['wa' as WarriorId],
        }),
      },
    });
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/3 pending/i)).toBeInTheDocument();
  });

  it('only counts current week fights', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      arenaHistory: [
        makeFight({ id: 'f1' as any, week: 3, winner: 'A', by: 'Kill' }),
        makeFight({ id: 'f2' as any, week: 5,
    absoluteWeek: 5, winner: 'A', by: 'KO' }),
        makeFight({ id: 'f3' as any, week: 7, winner: 'D', by: 'KO' }),
      ],
    });
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/W:1/)).toBeInTheDocument();
    expect(screen.getByText(/L:0/)).toBeInTheDocument();
  });

  it('hides W/L/K line when no fights but has pending offers', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      boutOffers: {
        o1: makeOffer({
          id: 'o1' as any,
          status: 'Proposed',
          boutWeek: 5,
          warriorIds: ['wa' as WarriorId],
        }),
      },
    });
    render(<WeeklyDigestMini />);
    expect(screen.queryByText(/W:/)).not.toBeInTheDocument();
    expect(screen.getByText(/1 pending/i)).toBeInTheDocument();
  });

  it('hides pending indicator when no pending offers but has fights', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      arenaHistory: [makeFight({ id: 'f1' as any, winner: 'A', by: 'KO' })],
    });
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/W:1/)).toBeInTheDocument();
    expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
  });

  it('handles mixed: fights + pending offers', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      arenaHistory: [
        makeFight({ id: 'f1' as any, winner: 'A', by: 'Kill' }),
        makeFight({
          id: 'f2' as any,
          winner: 'A',
          by: 'KO',
          warriorIdA: 'rival-a' as WarriorId,
          warriorIdD: 'wc' as WarriorId,
        }),
      ],
      boutOffers: {
        o1: makeOffer({
          id: 'o1' as any,
          status: 'Proposed',
          boutWeek: 5,
          warriorIds: ['wa' as WarriorId],
        }),
        o2: makeOffer({
          id: 'o2' as any,
          status: 'Proposed',
          boutWeek: 6,
          warriorIds: ['wc' as WarriorId],
        }),
      },
    });
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/W:1/)).toBeInTheDocument();
    expect(screen.getByText(/L:1/)).toBeInTheDocument();
    expect(screen.getByText(/K:1/)).toBeInTheDocument();
    expect(screen.getByText(/2 pending/i)).toBeInTheDocument();
  });

  it('handles empty roster gracefully', () => {
    setState({
      week: 5,
    absoluteWeek: 5,
      roster: [],
      arenaHistory: [makeFight({ id: 'f1' as any, winner: 'A', by: 'Kill' })],
    });
    render(<WeeklyDigestMini />);
    expect(screen.getByText(/No activity/i)).toBeInTheDocument();
  });
});
