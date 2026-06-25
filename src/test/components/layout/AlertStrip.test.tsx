// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AlertStrip } from '@/components/layout/navigationShared';
import type { HubId } from '@/components/layout/navigationShared';

let mockIsTournamentWeek = false;

vi.mock('@/state/useGameStore', () => ({
  useBookmarks: vi.fn(() => []),
    useWorldState: vi.fn(() => ({ roster: [], isTournamentWeek: false })),
    useGameStore: vi.fn((selector?: any) =>
    selector ? selector({ isTournamentWeek: mockIsTournamentWeek }) : { isTournamentWeek: mockIsTournamentWeek }
  ),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const defaultAlerts: Record<HubId, number> = { stable: 0, world: 0, bookmarks: 0 };

describe('AlertStrip', () => {
  beforeEach(() => {
    mockIsTournamentWeek = false;
  });

  it('returns null when no stable alerts and not tournament week', () => {
    const { container } = render(<AlertStrip alerts={defaultAlerts} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders stable alert item when alerts.stable > 0', () => {
    const alerts = { ...defaultAlerts, stable: 3 };
    render(<AlertStrip alerts={alerts} />);
    expect(screen.getByText('3 alerts')).toBeInTheDocument();
  });

  it('stable alert shows "{count} alerts" label', () => {
    const alerts = { ...defaultAlerts, stable: 5 };
    render(<AlertStrip alerts={alerts} />);
    expect(screen.getByText('5 alerts')).toBeInTheDocument();
  });

  it('stable alert links to /stable', () => {
    const alerts = { ...defaultAlerts, stable: 1 };
    render(<AlertStrip alerts={alerts} />);
    expect(screen.getByText('1 alerts').closest('a')).toHaveAttribute('href', '/stable');
  });

  it('renders tournament week item when isTournamentWeek = true', () => {
    mockIsTournamentWeek = true;
    render(<AlertStrip alerts={defaultAlerts} />);
    expect(screen.getByText('Tournament week')).toBeInTheDocument();
  });

  it('tournament week item shows "Tournament week" label', () => {
    mockIsTournamentWeek = true;
    render(<AlertStrip alerts={defaultAlerts} />);
    expect(screen.getByText('Tournament week')).toBeInTheDocument();
  });

  it('tournament week item links to /world/tournaments', () => {
    mockIsTournamentWeek = true;
    render(<AlertStrip alerts={defaultAlerts} />);
    expect(screen.getByText('Tournament week').closest('a')).toHaveAttribute('href', '/world/tournaments');
  });

  it('renders both items when both conditions are true', () => {
    mockIsTournamentWeek = true;
    const alerts = { ...defaultAlerts, stable: 2 };
    render(<AlertStrip alerts={alerts} />);
    expect(screen.getByText('2 alerts')).toBeInTheDocument();
    expect(screen.getByText('Tournament week')).toBeInTheDocument();
  });

  it('uses custom LinkComponent when provided', () => {
    const CustomLink = ({ to, children, className }: any) => (
      <span data-testid="custom-alert-link" data-to={to} className={className}>
        {children}
      </span>
    );
    const alerts = { ...defaultAlerts, stable: 1 };
    render(<AlertStrip alerts={alerts} LinkComponent={CustomLink} />);
    expect(screen.getByTestId('custom-alert-link')).toBeInTheDocument();
  });

  it('passes itemClassName to link elements', () => {
    const alerts = { ...defaultAlerts, stable: 1 };
    render(<AlertStrip alerts={alerts} itemClassName="custom-item-class" />);
    const link = screen.getByText('1 alerts').closest('a');
    expect(link?.className).toMatch(/custom-item-class/);
  });
});
