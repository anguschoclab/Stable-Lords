// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HubSwitcher } from '@/components/layout/navigationShared';
import type { HubId } from '@/components/layout/navigationShared';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

const defaultAlerts: Record<HubId, number> = { stable: 0, world: 0, bookmarks: 0 };
const defaultAlertLinks: Record<HubId, string> = {
  stable: '/stable',
  world: '/world/tournaments',
  bookmarks: '/bookmarks',
};

describe('HubSwitcher', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders all 3 hubs (Stable, World, Bookmarks) as links with correct href', () => {
    render(
      <HubSwitcher activeHubId="stable" alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    expect(screen.getByRole('link', { name: /Stable/i })).toHaveAttribute('href', '/stable');
    expect(screen.getByRole('link', { name: /World/i })).toHaveAttribute('href', '/world');
    expect(screen.getByRole('link', { name: /Bookmarks/i })).toHaveAttribute('href', '/bookmarks');
  });

  it('renders hub labels as text', () => {
    render(
      <HubSwitcher activeHubId="stable" alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    expect(screen.getByText('Stable')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
  });

  it('applies active styling (text-primary bg-primary/10) to active hub', () => {
    render(
      <HubSwitcher activeHubId="stable" alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    const stableLink = screen.getByText('Stable').closest('a');
    expect(stableLink?.className).toMatch(/text-primary/);
    expect(stableLink?.className).toMatch(/bg-primary\/10/);
  });

  it('applies inactive styling (text-muted-foreground/60) to non-active hubs', () => {
    render(
      <HubSwitcher activeHubId="stable" alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    const worldLink = screen.getByText('World').closest('a');
    expect(worldLink?.className).toMatch(/text-muted-foreground\/60/);
  });

  it('shows ChevronRight icon only on active hub when showChevron=true (default)', () => {
    render(
      <HubSwitcher activeHubId="stable" alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    // Active hub (Stable) should have chevron — check by counting SVGs
    // Each hub has an icon SVG. Active hub with chevron has 2 SVGs, inactive have 1.
    const stableLink = screen.getByText('Stable').closest('a');
    const stableSvgs = stableLink?.querySelectorAll('svg');
    expect(stableSvgs?.length).toBe(2); // hub icon + chevron
  });

  it('does NOT show chevron when showChevron=false', () => {
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={defaultAlerts}
        alertLinks={defaultAlertLinks}
        showChevron={false}
      />
    );
    const stableLink = screen.getByText('Stable').closest('a');
    const stableSvgs = stableLink?.querySelectorAll('svg');
    expect(stableSvgs?.length).toBe(1); // only hub icon
  });

  it('does NOT show chevron on inactive hubs even when showChevron=true', () => {
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={defaultAlerts}
        alertLinks={defaultAlertLinks}
        showChevron={true}
      />
    );
    const worldLink = screen.getByText('World').closest('a');
    const worldSvgs = worldLink?.querySelectorAll('svg');
    expect(worldSvgs?.length).toBe(1); // only hub icon, no chevron
  });

  it('renders alert badge button when alertCount > 0', () => {
    const alerts = { ...defaultAlerts, stable: 3 };
    render(<HubSwitcher activeHubId="stable" alerts={alerts} alertLinks={defaultAlertLinks} />);
    expect(screen.getByLabelText('3 alerts for Stable')).toBeInTheDocument();
  });

  it('does NOT render alert badge when alertCount = 0', () => {
    render(
      <HubSwitcher activeHubId="stable" alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('alert badge shows correct count number', () => {
    const alerts = { ...defaultAlerts, world: 5 };
    render(<HubSwitcher activeHubId="stable" alerts={alerts} alertLinks={defaultAlertLinks} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('alert badge has correct aria-label="{count} alerts for {hub.label}"', () => {
    const alerts = { ...defaultAlerts, world: 2 };
    render(<HubSwitcher activeHubId="stable" alerts={alerts} alertLinks={defaultAlertLinks} />);
    expect(screen.getByLabelText('2 alerts for World')).toBeInTheDocument();
  });

  it('calls onAlertClick with (hubId, alertLink) when alert badge clicked and onAlertClick provided', () => {
    const onAlertClick = vi.fn();
    const alerts = { ...defaultAlerts, stable: 1 };
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={alerts}
        alertLinks={defaultAlertLinks}
        onAlertClick={onAlertClick}
      />
    );
    fireEvent.click(screen.getByLabelText('1 alerts for Stable'));
    expect(onAlertClick).toHaveBeenCalledWith('stable', '/stable');
  });

  it('calls navigate({ to: alertLink }) when alert badge clicked and no onAlertClick', () => {
    const alerts = { ...defaultAlerts, stable: 1 };
    render(<HubSwitcher activeHubId="stable" alerts={alerts} alertLinks={defaultAlertLinks} />);
    fireEvent.click(screen.getByLabelText('1 alerts for Stable'));
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/stable' });
  });

  it('alert badge click calls e.preventDefault() and e.stopPropagation() — parent link does not navigate', () => {
    const alerts = { ...defaultAlerts, stable: 1 };
    const onAlertClick = vi.fn();
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={alerts}
        alertLinks={defaultAlertLinks}
        onAlertClick={onAlertClick}
      />
    );
    const badge = screen.getByLabelText('1 alerts for Stable');
    fireEvent.click(badge);
    // If preventDefault/stopPropagation worked, onAlertClick is called (not navigate)
    expect(onAlertClick).toHaveBeenCalledOnce();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('uses custom LinkComponent when provided (renders custom element instead of <a>)', () => {
    const CustomLink = ({ to, children, className }: any) => (
      <span data-testid="custom-link" data-to={to} className={className}>
        {children}
      </span>
    );
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={defaultAlerts}
        alertLinks={defaultAlertLinks}
        LinkComponent={CustomLink}
      />
    );
    expect(screen.getAllByTestId('custom-link')).toHaveLength(3);
  });

  it('passes linkClassName to link element className', () => {
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={defaultAlerts}
        alertLinks={defaultAlertLinks}
        linkClassName="custom-link-class"
      />
    );
    const stableLink = screen.getByText('Stable').closest('a');
    expect(stableLink?.className).toMatch(/custom-link-class/);
  });

  it('passes iconClassName to hub icon className', () => {
    render(
      <HubSwitcher
        activeHubId="stable"
        alerts={defaultAlerts}
        alertLinks={defaultAlertLinks}
        iconClassName="custom-icon-class"
      />
    );
    const stableLink = screen.getByText('Stable').closest('a');
    const icon = stableLink?.querySelector('svg');
    expect(icon?.getAttribute('class')).toMatch(/custom-icon-class/);
  });

  it('renders all hubs even when activeHubId is null (no active hub styling)', () => {
    render(
      <HubSwitcher activeHubId={null} alerts={defaultAlerts} alertLinks={defaultAlertLinks} />
    );
    expect(screen.getByText('Stable')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
    // None should have active styling
    const stableLink = screen.getByText('Stable').closest('a');
    expect(stableLink?.className).not.toMatch(/bg-primary\/10/);
  });
});
