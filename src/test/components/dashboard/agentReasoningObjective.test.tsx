// @vitest-environment jsdom
/**
 * Stage E — plan-of-record surfacing in AgentReasoningWidget.
 * `agentMemory.seasonObjective` is the rival's quarter-length strategic
 * goal (Stage C); the weekly intent only services it. The widget must show
 * the objective — kind, rationale, remaining weeks — not just the intent.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentReasoningWidget } from '@/components/dashboard/AgentReasoningWidget';
import { makeRival } from '@/test/_fixtures/factories';
import type { AIAgentMemory } from '@/types/state.types';

let mockState: any = {};
vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));
vi.mock('zustand/react/shallow', () => ({ ...__SHARED_MOCKS.useShallow }));

const memory = (over: Partial<AIAgentMemory>): AIAgentMemory => ({
  lastTreasury: 1000,
  burnRate: 50,
  metaAwareness: {},
  knownRivals: [],
  currentIntent: 'CROWN_CAMPAIGN',
  opponentDossiers: {},
  ...over,
});

describe('AgentReasoningWidget — season objective', () => {
  beforeEach(() => {
    mockState = { rivals: [], roster: [], graveyard: [], retired: [], player: undefined };
  });

  it('renders the season objective kind, reason, and weeks remaining', () => {
    const rival = makeRival({
      agentMemory: memory({
        seasonObjective: {
          kind: 'CROWN',
          targetArenaId: 'arena-1',
          weeksRemaining: 6,
          reason: 'Champion looks beatable — pressing the ladder while form holds',
        },
      }),
    });
    render(<AgentReasoningWidget rival={rival} />);
    expect(screen.getByTestId('season-objective')).toHaveTextContent(/crown/i);
    expect(screen.getByText(/champion looks beatable/i)).toBeInTheDocument();
    expect(screen.getByTestId('season-objective')).toHaveTextContent(/6/);
  });

  it('omits the objective block when the stable has no plan-of-record', () => {
    const rival = makeRival({ agentMemory: memory({}) });
    render(<AgentReasoningWidget rival={rival} />);
    expect(screen.queryByTestId('season-objective')).toBeNull();
  });
});
