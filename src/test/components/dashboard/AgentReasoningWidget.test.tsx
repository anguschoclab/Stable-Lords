// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentReasoningWidget } from '@/components/dashboard/AgentReasoningWidget';
import { makeRival } from '@/test/_fixtures/factories';
import type { StableId } from '@/types/shared.types';

let mockState: any = {};
vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));
vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

describe('AgentReasoningWidget (H.1)', () => {
  beforeEach(() => {
    mockState = { rivals: [], roster: [], graveyard: [], retired: [], player: undefined };
  });

  it('renders the strategy reason text from real state', () => {
    const rival = makeRival({
      strategy: {
        intent: 'VENDETTA',
        planWeeksRemaining: 4,
        targetStableId: 'player-1' as StableId,
        reason: 'Grudge: player beat this stable twice this season',
      },
    });
    mockState.player = { id: 'player-1' as StableId, stableName: 'My Stable' };
    render(<AgentReasoningWidget rival={rival} />);
    expect(
      screen.getByText(/player beat this stable twice/i)
    ).toBeInTheDocument();
  });

  it('renders the season record W-L-K from agentMemory', () => {
    const rival = makeRival({
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 50,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'EXPANSION',
        seasonRecord: { wins: 5, losses: 2, kills: 1, rosterSizeAtSeasonStart: 7 },
        opponentDossiers: {},
      },
      strategy: { intent: 'EXPANSION', planWeeksRemaining: 3 },
    });
    render(<AgentReasoningWidget rival={rival} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByTestId('season-record')).toHaveTextContent('5-2-1');
  });

  it('shows TOURNAMENT_CAMPAIGN as an active intent label', () => {
    const rival = makeRival({
      agentMemory: {
        lastTreasury: 1000,
        burnRate: 50,
        metaAwareness: {},
        knownRivals: [],
        currentIntent: 'TOURNAMENT_CAMPAIGN',
        opponentDossiers: {},
      },
      strategy: { intent: 'TOURNAMENT_CAMPAIGN', planWeeksRemaining: 2 },
    });
    render(<AgentReasoningWidget rival={rival} />);
    expect(screen.getByText(/tournament campaign/i)).toBeInTheDocument();
  });

  it('renders a cause chip on timeline events carrying a typed cause', () => {
    const rival = makeRival({
      actionHistory: [
        {
          id: 'e1',
          week: 3,
          type: 'ROSTER',
          description: 'Poached Warrior X from Stable Y for 80g',
          riskTier: 'Medium',
          cause: 'WEALTH_ACCUMULATION',
        },
      ],
    });
    render(<AgentReasoningWidget rival={rival} />);
    expect(screen.getByText(/Poached Warrior X/i)).toBeInTheDocument();
    expect(screen.getByTestId('cause-chip-e1')).toHaveTextContent(/wealth/i);
  });
});
