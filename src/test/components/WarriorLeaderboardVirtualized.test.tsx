// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WarriorRow } from '@/types/leaderboard';

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  useGameStore: (selector?: any) => {
    const state = {
      isBookmarked: () => false,
      toggleBookmark: vi.fn(),
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

function makeWarriorRows(n: number): WarriorRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}`,
    name: `Warrior${i}`,
    stableName: `Stable${i % 5}`,
    stableId: `s${i % 5}`,
    fame: 100 - i,
    wins: 20 - (i % 10),
    losses: i % 10,
    kills: i % 5,
    winRate: 100 - (i % 20),
    style: ['Brawler', 'Technician', 'Striker'][i % 3]!,
    isPlayer: i === 0,
    officialRank: i + 1,
    compositeScore: 90 - i,
  }));
}

describe('WarriorLeaderboard (virtualized)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders sticky header with all column labels', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(<WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />);
    // Check at least one column header is rendered
    expect(screen.getAllByText(/^Rank$/).length).toBeGreaterThan(0);
  });

  it('renders all filtered rows in jsdom (fallback, no .slice(0,100))', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(50);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(<WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />);
    // All 50 rows should render in jsdom fallback
    expect(screen.getAllByText(/Warrior\d+/).length).toBeGreaterThanOrEqual(50);
  });

  it('row count matches filtered.length — no 100-row cap', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(150);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(<WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />);
    // With 150 rows, the fallback should render all 150
    const rowElements = screen.getAllByText(/Warrior\d+/);
    expect(rowElements.length).toBeGreaterThanOrEqual(150);
  });

  it('scroll container exists with max-h and overflow-auto classes', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    const { container } = render(
      <WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />
    );
    const scrollContainer = container.querySelector('[class*="max-h"][class*="overflow-auto"]');
    expect(scrollContainer).not.toBeNull();
  });

  it('renders 200+ rows without crash', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(220);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(
      <WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />
    );
    expect(screen.getAllByText(/Warrior\d+/).length).toBeGreaterThan(0);
  });

  it('sort header click triggers onSort callback', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const onSort = vi.fn();
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(<WarriorLeaderboard rows={rows} sort={sort} onSort={onSort} />);
    // Click on a sortable header — find by aria-label
    const sortButton = screen.getByLabelText('Sort by Rank');
    fireEvent.click(sortButton);
    expect(onSort).toHaveBeenCalled();
  });

  it('player row highlighted with bg-primary class', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(
      <WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />
    );
    const playerRow = screen.getByText('Warrior0').closest('tr');
    expect(playerRow).not.toBeNull();
    expect(playerRow!.className).toContain('bg-primary');
  });
});
