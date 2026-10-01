// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import PromoterDetail from '@/pages/PromoterDetail';
import { makePromoter } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';

/**
 * Region-pinning spec for PromoterDetail (297-line component — Phase-6
 * decomposition + L2 PageFrame gap).
 */

let mockId = '';
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ id: mockId }),
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

describe('PromoterDetail page (region pinning)', () => {
  beforeEach(() => {
    useGameStore.setState({ promoters: {}, boutOffers: {}, absoluteWeek: 10 } as never);
  });

  it('renders not-found fallback for unknown promoter id', () => {
    mockId = 'nope';
    render(<PromoterDetail />);
    expect(screen.getByText('Promoter not found.')).toBeTruthy();
  });

  it('renders the promoter dossier for a real promoter', () => {
    const p = makePromoter({ name: 'Cassius the Magnanimous' });
    useGameStore.setState({
      promoters: { [p.id]: p },
      boutOffers: {},
      absoluteWeek: 10,
    } as never);
    mockId = p.id;
    render(
      <TooltipProvider>
        <PromoterDetail />
      </TooltipProvider>
    );
    expect(screen.getAllByText(/Cassius the Magnanimous/).length).toBeGreaterThan(0);
  });
});
