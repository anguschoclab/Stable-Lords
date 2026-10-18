// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ControlCenter from '@/pages/ControlCenter';
import { useGameStore } from '@/state/useGameStore';
import { TooltipProvider } from '@/components/ui/tooltip';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('ControlCenter Page', () => {
  it('renders the Council Briefing widget in the overview tab', () => {
    useGameStore.setState({
      player: {
        id: 'p1',
        name: 'Lanista Maximus',
        stableName: 'Ludus Magnus',
        gold: 1000,
        reputation: 50,
      } as any,
      week: 2,
      absoluteWeek: 2,
      season: 1 as any,
      roster: [],
      boutOffers: {},
      arenaHistory: [],
    });

    render(
      <TooltipProvider>
        <ControlCenter />
      </TooltipProvider>
    );

    expect(screen.getByText(/Lanista's War Council Directive/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review War Council/i })).toHaveAttribute(
      'href',
      '/stable/advisor'
    );
  });

  it('groups the command surface into truthful weekly-loop sections', () => {
    useGameStore.setState({
      player: {
        id: 'p1',
        name: 'Lanista Maximus',
        stableName: 'Ludus Magnus',
        gold: 1000,
        reputation: 50,
      } as any,
      week: 2,
      absoluteWeek: 2,
      season: 1 as any,
      roster: [],
      boutOffers: {},
      arenaHistory: [],
      treasury: 250,
      fame: 10,
    });

    render(
      <TooltipProvider>
        <ControlCenter />
      </TooltipProvider>
    );

    expect(screen.getByRole('region', { name: /Attention Required/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Solvency and Record/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Required Decisions/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Scheduled Bouts/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Last Week's Consequences/i })).toBeInTheDocument();
    expect(screen.getByText(/Treasury: 250g/i)).toBeInTheDocument();
  });
});
