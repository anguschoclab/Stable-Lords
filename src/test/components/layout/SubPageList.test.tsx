// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SubPageList } from '@/components/layout/navigationShared';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('SubPageList', () => {
  it('renders nothing when activeHubId is null', () => {
    const { container } = render(<SubPageList activeHubId={null} currentPath="/stable" />);
    // AnimatePresence renders nothing when child is falsy
    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders correct number of pages for stable hub (13)', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    expect(screen.getAllByRole('link')).toHaveLength(13);
  });

  it('renders correct number of pages for world hub (7)', () => {
    render(<SubPageList activeHubId="world" currentPath="/world" />);
    expect(screen.getAllByRole('link')).toHaveLength(7);
  });

  it('renders no pages for bookmarks hub (0 pages)', () => {
    render(<SubPageList activeHubId="bookmarks" currentPath="/bookmarks" />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('marks exact-match page as active when currentPath === page.to and exact: true', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    const overviewLink = screen.getByText('Overview').closest('a');
    expect(overviewLink?.className).toMatch(/text-foreground/);
    expect(overviewLink?.className).toMatch(/bg-white\/8/);
  });

  it('marks prefix-match page as active when currentPath.startsWith(page.to + "/")', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable/roster/extra" />);
    const rosterLink = screen.getByText('Roster').closest('a');
    expect(rosterLink?.className).toMatch(/text-foreground/);
  });

  it('does NOT mark non-matching pages as active', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable/training" />);
    const rosterLink = screen.getByText('Roster').closest('a');
    // Inactive pages have text-muted-foreground/50, not text-foreground
    // (hover:text-foreground/80 is present but the base class is muted)
    expect(rosterLink?.className).toMatch(/text-muted-foreground\/50/);
    expect(rosterLink?.className).not.toMatch(/bg-white\/8/);
  });

  it('active page has text-foreground bg-white/8 styling', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    const overviewLink = screen.getByText('Overview').closest('a');
    expect(overviewLink?.className).toMatch(/text-foreground/);
    expect(overviewLink?.className).toMatch(/bg-white\/8/);
  });

  it('inactive page has text-muted-foreground/50 styling', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    const rosterLink = screen.getByText('Roster').closest('a');
    expect(rosterLink?.className).toMatch(/text-muted-foreground\/50/);
  });

  it('renders page labels as text', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Roster')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Planner')).toBeInTheDocument();
  });

  it('renders page icons (SVG elements)', () => {
    const { container } = render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('uses custom LinkComponent when provided', () => {
    const CustomLink = ({ to, children, className }: any) => (
      <span data-testid="custom-page-link" data-to={to} className={className}>
        {children}
      </span>
    );
    render(<SubPageList activeHubId="stable" currentPath="/stable" LinkComponent={CustomLink} />);
    expect(screen.getAllByTestId('custom-page-link')).toHaveLength(13);
  });

  it('renders motion indicator div when useMotionIndicator=true (default) and page is active', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" />);
    // The motion indicator is a div with class containing "bg-primary" and "w-0.5"
    const activeLink = screen.getByText('Overview').closest('a');
    const indicator = activeLink?.querySelector('.bg-primary.w-0\\.5');
    expect(indicator).toBeInTheDocument();
  });

  it('renders static indicator div when useMotionIndicator=false and page is active', () => {
    render(<SubPageList activeHubId="stable" currentPath="/stable" useMotionIndicator={false} />);
    const activeLink = screen.getByText('Overview').closest('a');
    // Static indicator is a plain div (not motion.div), still has bg-primary w-0.5
    const indicator = activeLink?.querySelector('.bg-primary.w-0\\.5');
    expect(indicator).toBeInTheDocument();
  });
});
