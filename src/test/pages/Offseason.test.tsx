// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeTestWarrior } from '@/test/_fixtures/namedWarrior';
import Offseason from '@/pages/Offseason';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/components/ledger', () => ({
  YearEndRecap: () => <div data-testid="year-end-recap" />,
  SeasonSynthesis: () => <div data-testid="season-synthesis" />,
}));

function seed(partial: Record<string, unknown> = {}) {
  const state = createFreshState('test-seed');
  useGameStore.getState().loadGame('test-slot', state);
  useGameStore.setState({
    week: 1,
    roster: [],
    trainers: [],
    treasury: 500,
    ...partial,
  } as never);
}

describe('Offseason guided checklist', () => {
  beforeEach(() => {
    cleanup();
    seed();
  });

  it('exposes the season-close checklist with links to every resolving workspace', () => {
    render(<Offseason />);

    const checklist = screen.getByRole('region', { name: 'Season Close Checklist' });
    expect(checklist).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review roster/i })).toHaveAttribute(
      'href',
      '/stable/recruit'
    );
    expect(screen.getByRole('link', { name: /Review staff/i })).toHaveAttribute(
      'href',
      '/stable/trainers'
    );
    expect(screen.getByRole('link', { name: /Audit ledger/i })).toHaveAttribute(
      'href',
      '/stable/finance'
    );
  });

  it('marks close season eligible only during the offseason window', () => {
    const { rerender } = render(<Offseason />);
    expect(screen.getByText('Close eligible')).toBeInTheDocument();

    act(() =>
      useGameStore.setState({ week: 5, roster: [makeTestWarrior('w1', 'Alpha')] } as never)
    );
    rerender(<Offseason />);
    expect(screen.getByText('Close unavailable')).toBeInTheDocument();
  });
});
