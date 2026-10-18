// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Scouting from '@/pages/Scouting';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeRivalStable } from '@/test/_fixtures/factories';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

vi.mock('@/components/scouting/ScoutIntelTab', () => ({
  ScoutIntelTab: () => <div data-testid="scout-intel-tab" />,
}));
vi.mock('@/components/scouting/StableComparison', () => ({
  StableComparison: () => <div data-testid="stable-comparison" />,
}));
vi.mock('@/components/scouting/WarriorComparison', () => ({
  WarriorComparison: () => <div data-testid="warrior-comparison" />,
}));
vi.mock('@/components/charts/ReputationQuadrant', () => ({
  ReputationQuadrant: () => <div data-testid="reputation-quadrant" />,
}));

describe('Scouting page header', () => {
  it('reports real rival/report counts instead of a fabricated scout status', () => {
    const state = createFreshState('scouting-header-seed');
    state.rivals = [
      makeRivalStable('rival-a', [makeTestWarrior('a1', 'Alpha')]),
      makeRivalStable('rival-b', [makeTestWarrior('b1', 'Beta')]),
      makeRivalStable('rival-c', [makeTestWarrior('c1', 'Gamma')]),
    ];
    state.scoutReports = [
      { id: 'report-1', warriorName: 'Alpha' },
      { id: 'report-2', warriorName: 'Beta' },
    ] as GameState['scoutReports'];
    useGameStore.getState().loadGame('scouting-header', state as GameState);

    render(<Scouting />);

    expect(screen.getByText('2 Filed')).toBeInTheDocument();
    expect(screen.getByText('3 Tracked')).toBeInTheDocument();
    expect(screen.queryByText(/Scouts at work/i)).not.toBeInTheDocument();
  });
});
