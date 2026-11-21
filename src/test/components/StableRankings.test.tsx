// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { StableRow } from '@/types/leaderboard';
import { useGameStore } from '@/state/useGameStore';

vi.mock('@tanstack/react-router', () => ({ ...__SHARED_MOCKS.routerLink }));

function makeRow(i: number, over: Partial<StableRow> = {}): StableRow {
  return {
    id: `stable-${i}`,
    name: `Stable ${i}`,
    ownerName: `Owner ${i}`,
    fame: 1000 - i,
    wins: 50 - i,
    losses: i,
    kills: i % 4,
    winRate: Math.round(((50 - i) / 50) * 100),
    roster: 5,
    tier: 'Established',
    motto: '',
    isPlayer: i === 0,
    ...over,
  };
}

function makeRows(n: number): StableRow[] {
  return Array.from({ length: n }, (_, i) => makeRow(i));
}

const SORT = { field: 'fame', dir: 'desc' as const };

describe('StableRankings (virtualized)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      isBookmarked: () => false,
      toggleBookmark: vi.fn(),
    } as never);
  });

  it('renders all rows via jsdom fallback — no render cap', async () => {
    const { StableRankings } = await import('@/components/world/StableRankings');
    render(<StableRankings rows={makeRows(150)} sort={SORT} onSort={vi.fn()} />);
    expect(screen.getAllByText(/^Stable \d+$/).length).toBeGreaterThanOrEqual(150);
  });

  it('mounts a bounded scroll container (max-h + overflow-auto)', async () => {
    const { StableRankings } = await import('@/components/world/StableRankings');
    const { container } = render(
      <StableRankings rows={makeRows(5)} sort={SORT} onSort={vi.fn()} />
    );
    const scroll = container.querySelector('[class*="max-h"][class*="overflow-auto"]');
    expect(scroll).not.toBeNull();
  });

  it('keeps the table header sticky', async () => {
    const { StableRankings } = await import('@/components/world/StableRankings');
    const { container } = render(
      <StableRankings rows={makeRows(5)} sort={SORT} onSort={vi.fn()} />
    );
    const thead = container.querySelector('thead');
    expect(thead?.className).toContain('sticky');
  });

  it('sort header click triggers onSort with the column field', async () => {
    const { StableRankings } = await import('@/components/world/StableRankings');
    const onSort = vi.fn();
    render(<StableRankings rows={makeRows(5)} sort={SORT} onSort={onSort} />);
    fireEvent.click(screen.getByLabelText('Sort by Stable'));
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('renders first and last rank indexes correctly', async () => {
    const { StableRankings } = await import('@/components/world/StableRankings');
    const { container } = render(
      <StableRankings rows={makeRows(40)} sort={SORT} onSort={vi.fn()} />
    );
    expect(screen.getByText('Stable 0')).toBeInTheDocument();
    expect(screen.getByText('Stable 39')).toBeInTheDocument();
    // jsdom fallback mounts every data row (virtualizer returns no items)
    expect(container.querySelectorAll('tbody tr').length).toBe(40);
  });

  it('empty rows render header and title without crash', async () => {
    const { StableRankings } = await import('@/components/world/StableRankings');
    render(<StableRankings rows={[]} sort={SORT} onSort={vi.fn()} />);
    expect(screen.getByLabelText('Sort by Stable')).toBeInTheDocument();
  });
});
