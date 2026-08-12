import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StableRankings } from '@/components/world/StableRankings';
import { StableRankingsTitle } from '@/components/world/StableRankingsTitle';
import { StableRankingsHeader } from '@/components/world/StableRankingsHeader';
import { WarriorLeaderboardTitle } from '@/components/world/WarriorLeaderboardTitle';
import { WarriorLeaderboardFilters } from '@/components/world/WarriorLeaderboardFilters';
import { WarriorLeaderboardRow } from '@/components/world/WarriorLeaderboardRow';
import { WorldStats } from '@/components/world/WorldStats';
import { RivalIntelligence } from '@/components/world/RivalIntelligence';
import type { StableRow, WarriorRow } from '@/types/leaderboard';

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

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark-btn">Bookmark</div>,
}));

vi.mock('@/components/widgets', () => ({
  MetaDriftWidget: () => <div data-testid="meta-drift">MetaDrift</div>,
}));

vi.mock('@/components/ui/sort-header', () => ({
  SortHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

describe('StableRankingsHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <StableRankingsHeader sort={{ field: 'fame', dir: 'desc' }} onSort={vi.fn()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('WarriorLeaderboardFilters', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <WarriorLeaderboardFilters
        classes={['Bashing Attack', 'Total Parry']}
        classFilter={null}
        setClassFilter={vi.fn()}
        quickFilter={null}
        setQuickFilter={vi.fn()}
        myWarriorsOnly={false}
        setMyWarriorsOnly={vi.fn()}
        onSort={vi.fn()}
        isFiltered={false}
        clearFilters={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('WarriorLeaderboardRow', () => {
  it('renders without crashing', () => {
    const row: WarriorRow = {
      id: 'w1', name: 'TestWarrior', stableName: 'StableA', stableId: 's1',
      fame: 50, wins: 10, losses: 5, kills: 3, winRate: 0.67,
      style: 'Bashing Attack', isPlayer: true, officialRank: 1, compositeScore: 100,
    };
    const { container } = render(
      <WarriorLeaderboardRow row={row} index={0} isFiltered={false} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('RivalIntelligence', () => {
  it('renders without crashing with empty rivals', () => {
    const { container } = render(<RivalIntelligence rivals={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
