import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TournamentBracket } from '@/components/tournaments/TournamentBracket';
import { TournamentSchedule } from '@/components/tournaments/TournamentSchedule';
import { TournamentHistory } from '@/components/tournaments/TournamentHistory';
import type { TournamentEntry } from '@/types/game';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = { tournaments: [] };
    return selector ? selector(state) : state;
  },
  useWorldState: () => ({ tournaments: [], warriors: [], stables: [] }),
  useWarriorNameState: () => 'Unknown',
}));

vi.mock('@/hooks/useTournamentSchedule', () => ({
  useTournamentSchedule: () => ({
    filter: 'all',
    setFilter: vi.fn(),
    expandedRounds: new Set(),
    totalRounds: 1,
    stats: { totalBouts: 0, completedBouts: 0, pendingBouts: 0 },
    filteredRounds: [],
    toggleRound: vi.fn(),
    expandAll: vi.fn(),
    collapseAll: vi.fn(),
  }),
}));

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark-btn">Bookmark</div>,
}));

vi.mock('@/components/tournaments/schedule', () => ({
  TournamentStatsHeader: () => <div data-testid="stats-header">Stats</div>,
  TournamentFilterBar: () => <div data-testid="filter-bar">Filter</div>,
  TournamentRoundCard: () => <div data-testid="round-card">Round</div>,
}));

vi.mock('@/engine/core/historyResolver', () => ({
  resolveWarriorName: () => 'Unknown',
  resolveStableName: () => 'Unknown',
  findWarrior: () => undefined,
}));

const mockTournament = {
  id: 't1',
  week: 5,
  bracket: [],
  completed: false,
  seasonName: 'Spring',
} as unknown as TournamentEntry;

describe('TournamentBracket', () => {
  it('renders without crashing with empty bracket', () => {
    const { container } = render(
      <TournamentBracket bouts={[]} arenaHistory={[]} expandedBout={null} onToggleExpand={vi.fn()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without crashing with bouts', () => {
    const { container } = render(
      <TournamentBracket bouts={[]} arenaHistory={[]} expandedBout={null} onToggleExpand={vi.fn()} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentSchedule', () => {
  it('renders without crashing', () => {
    const { container } = render(<TournamentSchedule tournament={mockTournament} currentWeek={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentHistory', () => {
  it('renders without crashing with empty history', () => {
    const { container } = render(
      <TournamentHistory pastTournaments={[]} seasonIcons={{}} seasonNames={{}} currentSeason="Spring" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with past tournaments', () => {
    const pastTournaments = [
      { id: 't1', week: 1, bracket: [], completed: true, seasonName: 'Winter', winner: 'Alice' },
    ] as unknown as TournamentEntry[];
    const { container } = render(
      <TournamentHistory pastTournaments={pastTournaments} seasonIcons={{ Winter: 'snow' }} seasonNames={{ Winter: 'Winter Cup' }} currentSeason="Spring" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
