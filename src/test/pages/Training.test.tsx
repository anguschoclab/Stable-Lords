// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import '@/test/_setup/setup';

const mockState = vi.hoisted(() => ({
  roster: [] as any[],
  trainingAssignments: [],
  seasonalGrowth: [],
  season: 'Spring',
  trainers: [],
  setState: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/state/useGameStore', () => ({
  useWorldState: () => mockState,
  useGameStore: (selector?: (state: any) => any) =>
    selector ? selector(mockState) : mockState,
}));

import Training from '@/pages/Training';

function renderTraining() {
  return render(
    <TooltipProvider>
      <Training />
    </TooltipProvider>
  );
}

describe('Training page', () => {
  it('renders active warriors but not inactive warriors', () => {
    const base = {
      attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
      injuries: [],
      style: 'STRIKING ATTACK',
      career: { wins: 0, losses: 0, kills: 0 },
      fame: 0,
      popularity: 0,
      titles: [],
      flair: [],
      traits: [],
    };
    mockState.roster = [
      { id: 'w1', name: 'Active Warrior', status: 'Active', ...base },
      { id: 'w2', name: 'Dead Warrior', status: 'Dead', ...base },
      { id: 'w3', name: 'Retired Warrior', status: 'Retired', ...base },
    ];

    renderTraining();

    expect(screen.queryByText('Active Warrior')).toBeInTheDocument();
    expect(screen.queryByText('Dead Warrior')).not.toBeInTheDocument();
    expect(screen.queryByText('Retired Warrior')).not.toBeInTheDocument();
  });
});
