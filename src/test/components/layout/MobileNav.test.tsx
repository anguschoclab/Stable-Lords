// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileNav } from '@/components/layout/MobileNav';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', async () => {
  const React = await import('react');
  return {
    Link: React.forwardRef<
      HTMLAnchorElement,
      { to: string; children: React.ReactNode; className?: string }
    >(({ to, ...props }, ref) => <a ref={ref} href={to} {...props} />),
    useLocation: () => ({ pathname: '/stable' }),
    useNavigate: () => vi.fn(),
  };
});

describe('MobileNav', () => {
  beforeEach(() => {
    useGameStore
      .getState()
      .loadGame('mobile-nav-contract', createFreshState('mobile-nav-seed') as GameState);
  });

  it('opens an accessible drawer, navigates, closes, and restores trigger focus', async () => {
    render(
      <TooltipProvider>
        <MobileNav />
      </TooltipProvider>
    );
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });

    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('link', { name: 'Roster' })).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'World' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('link', { name: 'Roster' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
