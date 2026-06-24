// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Warrior } from '@/types/game';
import { FightingStyle } from '@/types/game';

const mockHelpers = {
  navigate: vi.fn(),
};

let mockRoster: Warrior[] = [];

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockHelpers.navigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: any) => {
    const state = {
      isBookmarked: () => false,
      roster: mockRoster,
      player: { id: 'p1', name: 'Player', stableName: "Dragon's Hearth", fame: 0, renown: 0, titles: 0 },
      rivals: [],
      retired: [],
      graveyard: [],
    };
    return selector ? selector(state) : state;
  },
  useWorldState: () => ({
    player: { id: 'p1', name: 'Player', stableName: "Dragon's Hearth", fame: 0, renown: 0, titles: 0 },
    rivals: [],
    roster: mockRoster,
    retired: [],
    graveyard: [],
  }),
}));

vi.mock('@/hooks/useActiveRoster', () => ({
  useActiveRoster: () => mockRoster,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/stable/RosterWarriorRow', () => ({
  RosterWarriorRow: ({ warrior }: any) => (
    <div data-testid="roster-warrior-row">{warrior.name}</div>
  ),
}));

function makeRosterItems(n: number): Warrior[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `w${i}` as any,
    name: `RosterWarrior${i}`,
    style: FightingStyle.AimedBlow,
    age: 20 + i,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 50 + i,
    popularity: 0,
    career: { wins: i, losses: 5, kills: 0 },
    titles: [],
    injuries: [],
    flair: [],
    champion: i === 0,
    status: 'Active',
    traits: [],
    potential: null,
  } as unknown as Warrior));
}

describe('RosterWall animation fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoster = [];
  });

  it('renders all roster items (no virtualization)', async () => {
    mockRoster = makeRosterItems(5);
    const { RosterWall } = await import('@/components/stable/RosterWall');
    render(<RosterWall />);
    expect(screen.getByText('RosterWarrior0')).toBeInTheDocument();
    expect(screen.getByText('RosterWarrior1')).toBeInTheDocument();
    expect(screen.getByText('RosterWarrior4')).toBeInTheDocument();
  });

  it('renders with 10+ warriors without crash', async () => {
    mockRoster = makeRosterItems(12);
    const { RosterWall } = await import('@/components/stable/RosterWall');
    render(<RosterWall />);
    expect(screen.getByText('RosterWarrior0')).toBeInTheDocument();
    expect(screen.getByText('RosterWarrior11')).toBeInTheDocument();
  });

  it('does not use AnimatePresence with popLayout', async () => {
    mockRoster = makeRosterItems(3);
    const { RosterWall } = await import('@/components/stable/RosterWall');
    const { container } = render(<RosterWall />);
    expect(container.innerHTML).not.toContain('popLayout');
    expect(screen.getByText('RosterWarrior0')).toBeInTheDocument();
    expect(screen.getByText('RosterWarrior1')).toBeInTheDocument();
    expect(screen.getByText('RosterWarrior2')).toBeInTheDocument();
  });

  it('empty roster state renders when filteredRoster.length === 0', async () => {
    mockRoster = [];
    const { RosterWall } = await import('@/components/stable/RosterWall');
    render(<RosterWall />);
    expect(screen.getByText(/^Roster$/)).toBeInTheDocument();
  });
});
