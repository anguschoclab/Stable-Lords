// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { WarriorRow } from '@/types/leaderboard';

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: (selector?: any) => {
      const state = {
        isBookmarked: () => false,
        toggleBookmark: vi.fn(),
      };
      return selector ? selector(state) : state;
    },
  };
});

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Force the virtualized branch by mocking useVirtualizer to return items
// even though jsdom has no layout dimensions.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { key: 'v0', index: 0, start: 0, end: 48, size: 48, lane: 0 },
      { key: 'v1', index: 1, start: 48, end: 96, size: 48, lane: 0 },
      { key: 'v2', index: 99, start: 4752, end: 4800, size: 48, lane: 0 }, // out-of-bounds → null guard
    ],
    getTotalSize: () => 4800,
  }),
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

describe('WarriorLeaderboard (virtualized branch)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a row for each in-bounds virtual item', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(<WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />);
    expect(screen.getByText('Warrior0')).toBeInTheDocument();
    expect(screen.getByText('Warrior1')).toBeInTheDocument();
  });

  it('out-of-bounds virtual item renders nothing (null guard survives)', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    // Only 5 rows, but virtualizer reports an item at index 99.
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    const { container } = render(
      <WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />,
    );
    // Warrior99 does not exist in the data — must not render.
    expect(screen.queryByText('Warrior99')).toBeNull();
    // Exactly two warrior rows rendered (the two in-bounds virtual items).
    const warriorNames = screen.getAllByText(/Warrior\d+/);
    expect(warriorNames).toHaveLength(2);
    // No crash: container still has content.
    expect(container.firstChild).not.toBeNull();
  });

  it('renders top spacer tr with height === items[0].start (0)', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    const { container } = render(
      <WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />,
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const firstTr = tbody!.querySelector('tr');
    expect(firstTr).not.toBeNull();
    // Top spacer height === items[0].start === 0.
    const height = (firstTr as HTMLElement).style.height;
    expect(Number.parseFloat(height || '0')).toBe(0);
  });

  it('renders bottom spacer tr with height === getTotalSize() - lastItem.end', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    const { container } = render(
      <WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />,
    );
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    const trs = tbody!.querySelectorAll('tr');
    // Last <tr> is the bottom spacer. getTotalSize()=4800, lastItem.end=4800 → 0.
    const lastTr = trs[trs.length - 1] as HTMLElement;
    expect(lastTr).not.toBeNull();
    const height = lastTr.style.height;
    expect(Number.parseFloat(height || '0')).toBe(0);
  });

  it('propagates isFiltered to rendered WarriorLeaderboardRow', async () => {
    const { WarriorLeaderboard } = await import('@/components/world/WarriorLeaderboard');
    const rows = makeWarriorRows(5);
    const sort = { field: 'fame', dir: 'desc' as const };
    render(<WarriorLeaderboard rows={rows} sort={sort} onSort={vi.fn()} />);

    // Toggle the "My Warriors" filter to force isFiltered=true. The filter
    // toggle is a <button> with aria-label="Toggle My Warriors" and aria-pressed.
    const myOnlyToggle = screen.getByRole('button', { name: /toggle my warriors/i });
    fireEvent.click(myOnlyToggle);

    // After filtering, only the player (row 0) survives; RankCell renders a
    // tiny secondary "#<officialRank>" span ONLY when isFiltered is true.
    const tinyRank = document.querySelector('.text-\\[8px\\]');
    expect(tinyRank).not.toBeNull();
  });
});
