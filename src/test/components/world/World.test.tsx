import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StableRankings } from '@/components/world/StableRankings';
import { StableRankingsTitle } from '@/components/world/StableRankingsTitle';
import { WarriorLeaderboardTitle } from '@/components/world/WarriorLeaderboardTitle';
import { WorldStats } from '@/components/world/WorldStats';
import type { StableRow } from '@/types/leaderboard';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      worldStats: { totalStables: 10, totalWarriors: 50, totalDeaths: 5 },
      isBookmarked: () => false,
      toggleBookmark: () => {},
    };
    return selector ? selector(state) : state;
  },
  useWorldState: () => ({ stables: [], warriors: [] }),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: Record<string, unknown>) => unknown) => fn,
}));

describe('StableRankingsTitle', () => {
  it('renders without crashing', () => {
    render(<StableRankingsTitle />);
    expect(screen.getByText('Eminent Stables')).toBeInTheDocument();
  });
});

describe('WarriorLeaderboardTitle', () => {
  it('renders unfiltered state', () => {
    render(<WarriorLeaderboardTitle isFiltered={false} filteredCount={0} />);
    expect(screen.getByText('Meritocracy Cycle Active')).toBeInTheDocument();
  });

  it('renders filtered state', () => {
    render(<WarriorLeaderboardTitle isFiltered={true} filteredCount={5} />);
    expect(screen.getByText('5 Filtered')).toBeInTheDocument();
  });
});

describe('StableRankings', () => {
  it('renders without crashing with empty rows', () => {
    const { container } = render(
      <StableRankings rows={[]} sort={{ field: 'fame', dir: 'desc' }} onSort={vi.fn()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with rows', () => {
    const rows: StableRow[] = [
      { id: 's1', name: 'Stable A', fame: 100, wins: 10, losses: 5, warriors: 5, rank: 1 } as unknown as StableRow,
    ];
    const { container } = render(
      <StableRankings rows={rows} sort={{ field: 'fame', dir: 'desc' }} onSort={vi.fn()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

describe('WorldStats', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <WorldStats stableCount={10} warriorCount={50} killCount={5} topStable="Champions" topStableId="s1" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without top stable', () => {
    const { container } = render(
      <WorldStats stableCount={10} warriorCount={50} killCount={5} topStable="—" topStableId={null} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
