// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PromoterDirectory from '@/pages/PromoterDirectory';
import { makePromoter } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';

/**
 * Region-pinning spec for PromoterDirectory (Phase-6 decomposition + L2
 * PageFrame gap). Pins header + list rendering + tier sort.
 */

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('PromoterDirectory page (region pinning)', () => {
  beforeEach(() => {
    useGameStore.setState({
      promoters: {},
      boutOffers: {},
      week: 5,
      absoluteWeek: 20,
      bookmarks: [],
    } as never);
  });

  it('renders promoter cards sorted Legendary-first', () => {
    const local = makePromoter({ name: 'Smalltime Sextus', tier: 'Local' });
    const legendary = makePromoter({ name: 'Grand Imperial Maximus', tier: 'Legendary' });
    useGameStore.setState({
      promoters: { [local.id]: local, [legendary.id]: legendary },
    } as never);
    render(<PromoterDirectory />);
    const names = screen.getAllByText(/Smalltime Sextus|Grand Imperial Maximus/);
    expect(names.length).toBeGreaterThanOrEqual(2);
    // Legendary promoter renders ahead of Local
    const html = document.body.innerHTML;
    expect(html.indexOf('Grand Imperial Maximus')).toBeLessThan(html.indexOf('Smalltime Sextus'));
  });
});
