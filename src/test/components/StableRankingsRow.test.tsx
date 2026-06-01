// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StableRankingsRow } from '@/components/world/StableRankingsRow';
import type { StableRow } from '@/types/leaderboard';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    asChild ? <>{children}</> : <div>{children}</div>
  ),
  TooltipContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="tooltip-content" className={className}>{children}</div>
  ),
}));

function makeRow(overrides: Partial<StableRow> = {}): StableRow {
  return {
    id: 's1',
    name: 'Test Stable',
    ownerName: 'Test Owner',
    fame: 100,
    wins: 10,
    losses: 5,
    kills: 2,
    winRate: 67,
    roster: 3,
    tier: 'Major',
    motto: '',
    isPlayer: false,
    ...overrides,
  };
}

describe('StableRankingsRow', () => {
  it('renders rival row with link to stable page', () => {
    render(<StableRankingsRow row={makeRow()} index={0} />);
    const link = screen.getByText('Test Stable').closest('a');
    expect(link).toHaveAttribute('href', '/world/stable/$id');
  });

  it('renders player row with link to ops overview and ACTIVE PLAYER badge', () => {
    render(<StableRankingsRow row={makeRow({ isPlayer: true })} index={0} />);
    const link = screen.getByText('Test Stable').closest('a');
    expect(link).toHaveAttribute('href', '/ops/overview');
    expect(screen.getByText('ACTIVE PLAYER')).toBeInTheDocument();
  });

  it('renders rank #1 with gold color', () => {
    render(<StableRankingsRow row={makeRow()} index={0} />);
    const rank = screen.getByText('1');
    expect(rank).toHaveClass('text-arena-gold');
  });

  it('renders rank #2 with muted color', () => {
    render(<StableRankingsRow row={makeRow()} index={1} />);
    const rank = screen.getByText('2');
    expect(rank).toHaveClass('text-muted-foreground');
  });

  it('renders rank #3 with faint muted color', () => {
    render(<StableRankingsRow row={makeRow()} index={2} />);
    const rank = screen.getByText('3');
    expect(rank).toHaveClass('text-muted-foreground/30');
  });

  it('renders tier badge with correct accent class', () => {
    render(<StableRankingsRow row={makeRow({ tier: 'Legendary' })} index={0} />);
    const badge = screen.getByText('Legendary');
    expect(badge).toHaveClass('bg-arena-gold');
    expect(badge).toHaveClass('text-primary-foreground');
  });

  it('renders kills > 0 in destructive color', () => {
    render(<StableRankingsRow row={makeRow({ kills: 5 })} index={0} />);
    const kills = screen.getByText('5');
    expect(kills).toHaveClass('text-destructive');
  });

  it('renders kills === 0 in muted color', () => {
    render(<StableRankingsRow row={makeRow({ kills: 0 })} index={0} />);
    const kills = screen.getByText('0');
    expect(kills).toHaveClass('text-muted-foreground/30');
  });

  it('renders motto tooltip when motto is present', () => {
    render(<StableRankingsRow row={makeRow({ motto: 'Glory or death' })} index={0} />);
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Glory or death');
  });

  it('does not render tooltip content when motto is empty', () => {
    render(<StableRankingsRow row={makeRow({ motto: '' })} index={0} />);
    expect(screen.queryByTestId('tooltip-content')).not.toBeInTheDocument();
  });
});
