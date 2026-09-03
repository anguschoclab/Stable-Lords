// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TournamentPrizeBadge,
  WarriorReadinessCard,
  WarriorReadinessBanner,
  ActiveTournamentManifest,
} from '@/components/tournaments';
import type { TournamentEntry, Warrior, FightSummary } from '@/types/game';

// ─── Shared mocks (mirror src/test/components/tournaments/Tournaments.test.tsx) ──
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

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/SectionDivider', () => ({
  SectionDivider: ({ label }: { label: string }) => <div data-testid="divider">{label}</div>,
}));

vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="imperial-ring">{children}</div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/tournaments/TournamentSchedule', () => ({
  TournamentSchedule: () => <div data-testid="tournament-schedule">Schedule</div>,
}));

vi.mock('@/components/tournaments/TournamentBracket', () => ({
  TournamentBracket: () => <div data-testid="tournament-bracket">Bracket</div>,
}));

vi.mock('@/lib/AudioManager', () => ({
  audioManager: { play: vi.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1',
    name: 'Test Warrior',
    injuries: [],
    fatigue: 0,
    ...overrides,
  } as unknown as Warrior;
}

function makeTournament(overrides: Partial<TournamentEntry> = {}): TournamentEntry {
  return {
    id: 't1',
    season: 'Spring',
    week: 5,
    tierId: 'Gold',
    name: 'Spring Classic',
    bracket: [],
    participants: [],
    completed: false,
    ...overrides,
  } as unknown as TournamentEntry;
}

// ─── TournamentPrizeBadge ─────────────────────────────────────────────────────
describe('TournamentPrizeBadge', () => {
  it('renders the three prize values for a known tier', () => {
    const { container } = render(<TournamentPrizeBadge tierId="Gold" />);
    expect(container.textContent).toContain('5,000g');
    expect(container.textContent).toContain('2,500g');
    expect(container.textContent).toContain('1,200g');
  });

  it('renders null for an unknown tier id', () => {
    const { container } = render(<TournamentPrizeBadge tierId="Platinum" />);
    expect(container.firstChild).toBeNull();
  });
});

// ─── WarriorReadinessCard ─────────────────────────────────────────────────────
describe('WarriorReadinessCard', () => {
  it('renders the warrior name', () => {
    render(<WarriorReadinessCard warrior={makeWarrior({ name: 'Gorgon' })} />);
    expect(screen.getByText('Gorgon')).toBeDefined();
  });

  it('shows "Status: Nominal" when injuries is empty', () => {
    render(<WarriorReadinessCard warrior={makeWarrior({ injuries: [] })} />);
    expect(screen.getByText(/Status: Nominal/i)).toBeDefined();
  });

  it('shows the injury severity text when injuries.length === 1', () => {
    render(
      <WarriorReadinessCard
        warrior={makeWarrior({
          injuries: [{ severity: 'Minor' } as never],
        })}
      />
    );
    expect(screen.getByText('Minor')).toBeDefined();
  });

  it('shows "N INJURIES" when injuries.length > 1', () => {
    render(
      <WarriorReadinessCard
        warrior={makeWarrior({
          injuries: [
            { severity: 'Minor' } as never,
            { severity: 'Major' } as never,
            { severity: 'Severe' } as never,
          ],
        })}
      />
    );
    expect(screen.getByText(/3 INJURIES/i)).toBeDefined();
  });

  it('shows "Fresh" label when fatigue < FATIGUE_FRESH', () => {
    render(<WarriorReadinessCard warrior={makeWarrior({ fatigue: 10 })} />);
    expect(screen.getByText('Fresh')).toBeDefined();
  });

  it('shows "Tired" label when FATIGUE_FRESH <= fatigue < FATIGUE_ELEVATED', () => {
    render(<WarriorReadinessCard warrior={makeWarrior({ fatigue: 40 })} />);
    expect(screen.getByText('Tired')).toBeDefined();
  });

  it('shows "Exhausted" label when fatigue >= FATIGUE_ELEVATED', () => {
    render(<WarriorReadinessCard warrior={makeWarrior({ fatigue: 75 })} />);
    expect(screen.getByText('Exhausted')).toBeDefined();
  });

  it('treats fatigue === undefined as 0 (Fresh)', () => {
    render(<WarriorReadinessCard warrior={makeWarrior({ fatigue: undefined })} />);
    expect(screen.getByText('Fresh')).toBeDefined();
  });
});

// ─── WarriorReadinessBanner ───────────────────────────────────────────────────
describe('WarriorReadinessBanner', () => {
  it('renders the "Warrior Readiness" section divider label', () => {
    render(
      <WarriorReadinessBanner
        tournament={makeTournament()}
        warriors={[makeWarrior()]}
      />
    );
    expect(screen.getByText('Warrior Readiness')).toBeDefined();
  });

  it('renders one WarriorReadinessCard per warrior', () => {
    render(
      <WarriorReadinessBanner
        tournament={makeTournament()}
        warriors={[
          makeWarrior({ id: 'w1', name: 'Alpha' }),
          makeWarrior({ id: 'w2', name: 'Beta' }),
          makeWarrior({ id: 'w3', name: 'Gamma' }),
        ]}
      />
    );
    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
    expect(screen.getByText('Gamma')).toBeDefined();
  });

  it('renders the TournamentPrizeBadge for the tournament tier', () => {
    render(
      <WarriorReadinessBanner
        tournament={makeTournament({ tierId: 'Silver' })}
        warriors={[makeWarrior()]}
      />
    );
    expect(screen.getByText('2,500g')).toBeDefined();
    expect(screen.getByText('1,250g')).toBeDefined();
    expect(screen.getByText('600g')).toBeDefined();
  });

  it('renders the "Combat Status Audit" header label', () => {
    render(
      <WarriorReadinessBanner
        tournament={makeTournament()}
        warriors={[makeWarrior()]}
      />
    );
    expect(screen.getByText(/Combat Status Audit/i)).toBeDefined();
  });
});

// ─── ActiveTournamentManifest ─────────────────────────────────────────────────
describe('ActiveTournamentManifest', () => {
  const baseProps = {
    arenaHistory: [] as FightSummary[],
    week: 5,
    expandedBout: null,
    onToggleExpand: vi.fn(),
    isReadyToStart: false,
    onExecuteRound: vi.fn(),
    onOpenPrep: vi.fn(),
    seasonIcon: '🌿',
  };

  it('renders the tournament name and "LIVE PHASE" badge', () => {
    render(
      <ActiveTournamentManifest
        tournament={makeTournament({ name: 'Spring Classic' })}
        {...baseProps}
      />
    );
    expect(screen.getByText('Spring Classic')).toBeDefined();
    expect(screen.getByText(/LIVE PHASE/i)).toBeDefined();
  });

  it('renders TournamentSchedule and TournamentBracket children', () => {
    render(
      <ActiveTournamentManifest
        tournament={makeTournament({ bracket: [{ round: 1, winner: undefined } as never] })}
        {...baseProps}
      />
    );
    expect(screen.getByTestId('tournament-schedule')).toBeDefined();
    expect(screen.getByTestId('tournament-bracket')).toBeDefined();
  });

  it('renders the "EXECUTE NEXT BOUT" button and fires onExecuteRound on click', () => {
    const onExecuteRound = vi.fn();
    render(
      <ActiveTournamentManifest
        tournament={makeTournament({ bracket: [{ round: 1, winner: undefined } as never] })}
        {...baseProps}
        onExecuteRound={onExecuteRound}
      />
    );
    const btn = screen.getByRole('button', { name: /EXECUTE NEXT BOUT/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(onExecuteRound).toHaveBeenCalledTimes(1);
  });

  it('renders "OPEN PREPARATION CONSOLE" button only when isReadyToStart is true', () => {
    const { rerender } = render(
      <ActiveTournamentManifest
        tournament={makeTournament({ bracket: [{ round: 1, winner: undefined } as never] })}
        {...baseProps}
        isReadyToStart={false}
      />
    );
    expect(screen.queryByRole('button', { name: /OPEN PREPARATION CONSOLE/i })).toBeNull();

    rerender(
      <ActiveTournamentManifest
        tournament={makeTournament({ bracket: [{ round: 1, winner: undefined } as never] })}
        {...baseProps}
        isReadyToStart={true}
      />
    );
    expect(screen.getByRole('button', { name: /OPEN PREPARATION CONSOLE/i })).toBeDefined();
  });

  it('hides the action footer when the bracket has no unresolved bouts', () => {
    render(
      <ActiveTournamentManifest
        tournament={makeTournament({
          bracket: [
            { round: 1, winner: 'w1' as never } as never,
            { round: 2, winner: 'w2' as never } as never,
          ],
        })}
        {...baseProps}
      />
    );
    expect(screen.queryByRole('button', { name: /EXECUTE NEXT BOUT/i })).toBeNull();
  });
});
