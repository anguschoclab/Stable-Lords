// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import StableLedger from '@/pages/StableLedger';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGameStore } from '@/state/useGameStore';
import { makeGameState } from '@/test/_fixtures/factories';
import { makeTournamentWarrior } from '@/test/_fixtures/tournamentState';
import { computeWeeklyBreakdown } from '@/engine/economy';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

const trainer = {
  id: 't1',
  name: 'Brother Cadfael',
  tier: 'Novice',
  focus: 'Conditioning',
  age: 41,
  fame: 3,
  contractWeeksLeft: 8,
};

function loadFinanceState(treasury = 100) {
  const state = makeGameState({
    treasury,
    roster: [makeTournamentWarrior('w1', 'Cassian')],
    trainers: [trainer],
    trainingAssignments: [{ warriorId: 'w1', type: 'attribute', attribute: 'ST' }],
  });
  useGameStore.setState(state as never);
  return state;
}

describe('StableLedger finance runway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('derives runway from actual treasury and projected weekly expenses', () => {
    const state = loadFinanceState(100);
    const breakdown = computeWeeklyBreakdown({ ...state, isPlayer: true });
    const runway = Math.floor(state.treasury / breakdown.totalExpenses);

    render(
      <TooltipProvider>
        <StableLedger />
      </TooltipProvider>
    );

    expect(runway).toBeGreaterThanOrEqual(0);
    expect(screen.getByText(`${runway} CYCLES REMAINING`)).toBeInTheDocument();
    expect(screen.getByText(/CRITICAL/)).toBeInTheDocument();
  });

  it('links financial decisions to the workspaces that resolve obligations', () => {
    loadFinanceState(100);
    render(
      <TooltipProvider>
        <StableLedger />
      </TooltipProvider>
    );

    const decisions = screen
      .getAllByRole('region', { name: /resolve weekly obligations/i })
      .at(-1)!;
    expect(within(decisions).getByRole('link', { name: /review training/i })).toHaveAttribute(
      'href',
      '/stable/training'
    );
    expect(within(decisions).getByRole('link', { name: /manage contracts/i })).toHaveAttribute(
      'href',
      '/stable/trainers'
    );
    expect(
      within(decisions).getByRole('link', { name: /recruit reinforcements/i })
    ).toHaveAttribute('href', '/stable/recruit');
  });
});
