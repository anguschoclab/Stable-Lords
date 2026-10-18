// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeftNav } from '@/components/layout/LeftNav';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

let currentPath = '/stable';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: currentPath }),
  useNavigate: () => vi.fn(),
}));

describe('LeftNav', () => {
  beforeEach(() => {
    currentPath = '/stable';
    useGameStore
      .getState()
      .loadGame('left-nav-contract', createFreshState('left-nav-seed') as GameState);
  });

  it('renders one navigation landmark with canonical hubs, task groups, and utility links', () => {
    render(<LeftNav />);
    const nav = screen.getByRole('navigation');

    expect(within(nav).getByRole('link', { name: /Stable/ })).toHaveAttribute(
      'href',
      '/stable'
    );
    expect(within(nav).getByRole('link', { name: /World/ })).toHaveAttribute(
      'href',
      '/world'
    );
    for (const section of ['Command', 'Roster', 'Operations', 'Tools']) {
      expect(within(nav).getByRole('heading', { name: section })).toBeInTheDocument();
    }
    for (const destination of ['Help', 'Bookmarks', 'Import / Export', 'Mods']) {
      expect(within(nav).getByRole('link', { name: destination })).toBeInTheDocument();
    }
  });

  it('switches the rendered task group when the active route belongs to World', () => {
    currentPath = '/world/tournaments';
    render(<LeftNav />);
    const nav = screen.getByRole('navigation');

    expect(within(nav).getByRole('link', { name: 'Tournaments' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Roster' })).not.toBeInTheDocument();
  });
});
