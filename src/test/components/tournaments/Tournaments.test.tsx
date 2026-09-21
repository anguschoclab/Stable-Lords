import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentBracket } from '@/components/tournaments/TournamentBracket';
import { TournamentSchedule } from '@/components/tournaments/TournamentSchedule';
import { TournamentHistory } from '@/components/tournaments/TournamentHistory';
import { TournamentPrepDialog } from '@/components/tournaments/TournamentPrepDialog';
import { ConnectionLines } from '@/components/tournaments/bracket/ConnectionLines';
import { MatchActions } from '@/components/tournaments/bracket/MatchActions';
import { MatchCardHeader } from '@/components/tournaments/bracket/MatchCardHeader';
import { WarriorSlots } from '@/components/tournaments/bracket/WarriorSlots';
import { MatchViewer } from '@/components/tournaments/bracket/MatchViewer';
import { TournamentStatsHeader } from '@/components/tournaments/schedule/TournamentStatsHeader';
import { TournamentFilterBar } from '@/components/tournaments/schedule/TournamentFilterBar';
import { TournamentBoutRow } from '@/components/tournaments/schedule/TournamentBoutRow';
import { TournamentRoundCard } from '@/components/tournaments/schedule/TournamentRoundCard';
import { ActiveTournamentManifest } from '@/components/tournaments/ActiveTournamentManifest';
import type { TournamentEntry, TournamentBout } from '@/types/game';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
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

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  WarriorNameTag: ({ name }: { name: string }) => <span>{name}</span>,
  StatBadge: ({ styleName }: { styleName: string }) => <span>{styleName}</span>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/engine/core/historyResolver', () => ({
  resolveWarriorName: (_s: unknown, _id: unknown, fallback?: string) => fallback ?? 'Unknown',
  resolveStableName: () => 'Unknown',
  findWarrior: () => undefined,
}));

vi.mock('@/engine/matchmaking/tournamentHelpers', () => ({
  isBronzeMatch: () => false,
  isChampionshipFinal: () => false,
  isByeMatch: () => false,
  getRoundName: () => 'Round 1',
  getEstimatedWeek: () => 1,
}));

vi.mock('@/components/BoutViewer', () => ({
  default: () => <div data-testid="bout-viewer">BoutViewer</div>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
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
      <TournamentBracket
        bouts={[]}
        arenaHistory={[]}
        expandedBout={null}
        onToggleExpand={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders without crashing with bouts', () => {
    const { container } = render(
      <TournamentBracket
        bouts={[]}
        arenaHistory={[]}
        expandedBout={null}
        onToggleExpand={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentSchedule', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TournamentSchedule tournament={mockTournament} currentWeek={5} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentPrepDialog', () => {
  it('renders without crashing when open', () => {
    const { container } = render(
      <TournamentPrepDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        activeWarriors={[]}
        seasonName="Spring"
        onStart={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders season name', () => {
    render(
      <TournamentPrepDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        activeWarriors={[]}
        seasonName="Spring"
        onStart={vi.fn()}
      />
    );
    expect(screen.getByText(/Spring Preparation/i)).toBeInTheDocument();
  });

  it('renders initiate button', () => {
    render(
      <TournamentPrepDialog
        isOpen={true}
        onOpenChange={vi.fn()}
        activeWarriors={[]}
        seasonName="Spring"
        onStart={vi.fn()}
      />
    );
    expect(screen.getByText(/INITIATE SEASON CAMPAIGN/i)).toBeInTheDocument();
  });
});

describe('TournamentHistory', () => {
  it('renders without crashing with empty history', () => {
    const { container } = render(
      <TournamentHistory
        pastTournaments={[]}
        seasonIcons={{}}
        seasonNames={{}}
        currentSeason="Spring"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders with past tournaments', () => {
    const pastTournaments = [
      { id: 't1', week: 1, bracket: [], completed: true, seasonName: 'Winter', winner: 'Alice' },
    ] as unknown as TournamentEntry[];
    const { container } = render(
      <TournamentHistory
        pastTournaments={pastTournaments}
        seasonIcons={{ Winter: 'snow' }}
        seasonNames={{ Winter: 'Winter Cup' }}
        currentSeason="Spring"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('expands a past tournament to show its recorded bouts from arenaHistory', () => {
    const pastTournaments = [
      { id: 't1', week: 12, bracket: [], completed: true, season: 'Winter', champion: 'Alice' },
    ] as unknown as TournamentEntry[];
    const arenaHistory = [
      {
        id: 'f1',
        tournamentId: 't1',
        title: 'Winter Cup Final',
        winner: 'A',
        by: 'Kill',
        week: 12,
      },
      {
        id: 'f2',
        tournamentId: 't1',
        title: 'Winter Cup Semifinal',
        winner: 'D',
        by: 'Decision',
        week: 12,
      },
      { id: 'f3', tournamentId: 'other', title: 'Unrelated Bout', winner: 'A', by: 'KO', week: 12 },
    ] as never[];
    render(
      <TournamentHistory
        pastTournaments={pastTournaments}
        seasonIcons={{ Winter: 'snow' }}
        seasonNames={{ Winter: 'Winter Cup' }}
        currentSeason="Spring"
        arenaHistory={arenaHistory}
      />
    );
    const toggle = screen.getByRole('button', { name: /bouts/i });
    fireEvent.click(toggle);
    expect(screen.getByText('Winter Cup Final')).toBeInTheDocument();
    expect(screen.getByText('Winter Cup Semifinal')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated Bout')).not.toBeInTheDocument();
  });
});

// ─── Bracket sub-component smoke tests ──────────────────────────────────────

const mockBout = {
  round: 1,
  matchIndex: 0,
  warriorIdA: 'w1' as never,
  warriorIdD: 'w2' as never,
  stableIdA: 's1' as never,
  stableIdD: 's2' as never,
  winner: null,
} as unknown as TournamentBout;

const mockGameState = { warriors: [], stables: [] } as never;

describe('ConnectionLines', () => {
  it('renders null for rIdx 0', () => {
    const { container } = render(
      <ConnectionLines rIdx={0} isBye={false} isPending={false} bronze={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders without crashing for rIdx > 0', () => {
    const { container } = render(
      <ConnectionLines rIdx={1} isBye={false} isPending={false} bronze={false} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('MatchActions', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MatchActions
        hasTranscript={true}
        isExpanded={false}
        boutKey="r1-m0"
        onToggleExpand={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('MatchCardHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <MatchCardHeader bout={mockBout} totalRounds={4} isPending={true} isBye={false} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('WarriorSlots', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <WarriorSlots
        bout={mockBout}
        boutKey="r1-m0"
        totalRounds={4}
        isAChosen={false}
        isDChosen={false}
        isBye={false}
        gameState={mockGameState}
        onToggleExpand={vi.fn()}
        isExpanded={false}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('MatchViewer', () => {
  it('renders without crashing', () => {
    const fightSummary = {
      warriorIdA: 'w1',
      warriorIdD: 'w2',
      styleA: 'Bashing Attack',
      styleD: 'Total Parry',
      winner: 'A',
      by: 'KO',
      transcript: [],
      isRivalry: false,
    } as never;
    const { container } = render(
      <MatchViewer
        bout={mockBout}
        fightSummary={fightSummary}
        gameState={mockGameState}
        onToggleExpand={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

// ─── Schedule sub-component smoke tests ─────────────────────────────────────

describe('TournamentStatsHeader', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TournamentStatsHeader stats={{ total: 8, completed: 4, byes: 1, upcoming: 3 }} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentFilterBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TournamentFilterBar
        filter="all"
        setFilter={vi.fn()}
        expandAll={vi.fn()}
        collapseAll={vi.fn()}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentBoutRow', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TournamentBoutRow bout={mockBout} state={mockGameState} round={1} />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('TournamentRoundCard', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <TournamentRoundCard
        round={1}
        bouts={[mockBout]}
        isExpanded={true}
        tournamentWeek={5}
        currentWeek={3}
        totalRounds={4}
        toggleRound={vi.fn()}
        state={mockGameState}
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('ActiveTournamentManifest progress and results', () => {
  const participants = [
    { id: 'w1', name: 'Champ One' },
    { id: 'w2', name: 'Runner Up' },
    { id: 'w3', name: 'Bronze Three' },
    { id: 'w4', name: 'Bronze Four' },
  ] as unknown as import('@/types/game').Warrior[];

  const completedTournament = {
    id: 't1',
    name: 'Spring Grand Melee',
    week: 5,
    participants,
    bracket: [
      { round: 6, matchIndex: 1, warriorIdA: 'w3', warriorIdD: 'w4', winner: 'D' },
      { round: 7, matchIndex: 0, warriorIdA: 'w1', warriorIdD: 'w2', winner: 'A' },
    ],
  } as unknown as TournamentEntry;

  const renderManifest = (tournament: TournamentEntry) =>
    render(
      <ActiveTournamentManifest
        tournament={tournament}
        arenaHistory={[]}
        week={5}
        expandedBout={null}
        onToggleExpand={vi.fn()}
        isReadyToStart={false}
        onExecuteRound={vi.fn()}
        onOpenPrep={vi.fn()}
        seasonIcon="🌸"
      />
    );

  it('renders the tournament progress strip', () => {
    renderManifest(completedTournament);
    expect(screen.getByText(/matches completed/i)).toBeInTheDocument();
  });

  it('renders the champion callout when the tournament is complete', () => {
    renderManifest(completedTournament);
    expect(screen.getByText(/Tournament Supreme Champion/i)).toBeInTheDocument();
    expect(screen.getByText('Champ One')).toBeInTheDocument();
  });

  it('renders the bronze highlight when the bronze bout is resolved', () => {
    renderManifest(completedTournament);
    expect(screen.getByText(/Third Place Medalist/i)).toBeInTheDocument();
    expect(screen.getByText('Bronze Four')).toBeInTheDocument();
  });

  it('hides champion and bronze callouts while the tournament is in progress', () => {
    const inProgress = {
      ...completedTournament,
      bracket: [
        { round: 6, matchIndex: 1, warriorIdA: 'w3', warriorIdD: 'w4', winner: 'D' },
        { round: 7, matchIndex: 0, warriorIdA: 'w1', warriorIdD: 'w2' },
      ],
    } as unknown as TournamentEntry;
    renderManifest(inProgress);
    expect(screen.queryByText(/Tournament Supreme Champion/i)).not.toBeInTheDocument();
    expect(screen.getByText(/matches completed/i)).toBeInTheDocument();
  });
});
