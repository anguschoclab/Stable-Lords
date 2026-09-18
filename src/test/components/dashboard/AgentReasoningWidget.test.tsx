/**
 * AgentReasoningWidget — UI honesty tests.
 *
 * Every value on screen must trace to real state: the intent label comes from
 * `rival.agentMemory.currentIntent`, the target line must resolve the rival's
 * stable name — and nothing may be fabricated (no invented confidence score).
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { RivalStableData } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';

let mockState: any = {};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector?: any) => (selector ? selector(mockState) : mockState)),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

vi.mock('@/components/dashboard/ActionTimeline', () => ({
  ActionTimeline: () => <div data-testid="timeline" />,
}));

import { AgentReasoningWidget } from '@/components/dashboard/AgentReasoningWidget';

function rival(over: Partial<RivalStableData> = {}): RivalStableData {
  return {
    id: 'stable_victim',
    owner: { stableName: 'Iron Pits' } as any,
    fame: 10,
    roster: [],
    treasury: 500,
    strategy: { intent: 'VENDETTA', targetStableId: 'stable_target', planWeeksRemaining: 3 },
    agentMemory: {
      lastTreasury: 500,
      burnRate: 0,
      metaAwareness: {},
      knownRivals: [],
      currentIntent: 'VENDETTA',
    },
    ...over,
  } as RivalStableData;
}

beforeEach(() => {
  mockState = {
    rivals: [
      rival(),
      rival({ id: 'stable_target' as StableId, owner: { stableName: 'Crimson Oath' } as any }),
    ],
  };
});

describe('AgentReasoningWidget', () => {
  it('shows the intent label for the rival current intent', () => {
    render(<AgentReasoningWidget rival={rival()} />);
    expect(screen.getByText('Owner Vendetta')).toBeInTheDocument();
  });

  it('falls back to Survival when no intent is recorded', () => {
    render(
      <AgentReasoningWidget
        rival={rival({ agentMemory: { lastTreasury: 0, burnRate: 0, metaAwareness: {}, knownRivals: [] } })}
      />
    );
    expect(screen.getByText('Survival')).toBeInTheDocument();
  });

  it('does not fabricate a confidence score', () => {
    render(<AgentReasoningWidget rival={rival()} />);
    expect(screen.queryByText(/confidence/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/94\.8/)).not.toBeInTheDocument();
  });

  it('resolves the targeted stable to its name, not its internal id', () => {
    render(<AgentReasoningWidget rival={rival()} />);
    expect(screen.getByText(/Crimson Oath/)).toBeInTheDocument();
    expect(screen.queryByText(/stable_target/)).not.toBeInTheDocument();
  });

  it('shows an honest fallback when there is no specific target', () => {
    render(
      <AgentReasoningWidget
        rival={rival({ strategy: { intent: 'EXPANSION', planWeeksRemaining: 2 } })}
      />
    );
    expect(screen.getByText(/all rivals/i)).toBeInTheDocument();
  });
});
