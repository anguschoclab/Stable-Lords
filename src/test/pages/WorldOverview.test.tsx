// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import WorldOverview from '@/pages/WorldOverview';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { FightingStyle } from '@/types/game';
import type { Warrior, GameState } from '@/types/game';
import '@/test/_setup/setup';

let storeOverride: any = {};

const defaultStoreState = {
  roster: [],
  newsletter: [],
  ledger: [],
  matchHistory: [],
  moodHistory: [],
  graveyard: [],
  retired: [],
  week: 1,
  season: 'Spring',
  year: 1,
  treasury: 500,
  tournaments: [],
  rivals: [],
  arenaHistory: [],
  trainers: [],
  trainingAssignments: [],
  fame: 0,
  player: {
    id: 'p1',
    name: 'Player',
    stableName: "Dragon's Hearth",
    fame: 0,
    renown: 0,
    titles: 0,
  },
};

// Mock useGameStore to avoid store initialization issues
vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: (selector?: any) => {
      const state = { ...defaultStoreState, ...storeOverride, isBookmarked: () => false };
      return selector ? selector(state) : state;
    },
    useWorldState: () => ({ ...defaultStoreState, ...storeOverride }),
  };
});

// Mock the router components
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Mock Radix UI Tabs to always render both contents for easy testing
vi.mock('@/components/ui/tabs', () => {
  return {
    Tabs: ({ children, defaultValue }: any) => (
      <div data-testid="tabs" data-default={defaultValue}>
        {children}
      </div>
    ),
    TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
    TabsTrigger: ({ value, children }: any) => (
      <button data-testid={`tab-trigger-${value}`}>{children}</button>
    ),
    TabsContent: ({ value, children }: any) => (
      <div data-testid={`tab-content-${value}`}>{children}</div>
    ),
  };
});

/**
 * Utility to create a dummy warrior for testing.
 * @param name - The warrior's name.
 * @param status - The warrior's status.
 * @param wins - Number of wins.
 * @param losses - Number of losses.
 * @param fame - Fame value.
 * @returns A warrior object for testing.
 */
function createDummyWarrior(
  name: string,
  status: Warrior['status'],
  wins: number,
  losses: number,
  fame: number
): Warrior {
  return {
    id: name,
    name,
    status,
    style: FightingStyle.AimedBlow,
    age: 20,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame,
    popularity: 0,
    career: { wins, losses, kills: 0 },
    titles: [],
    injuries: [],
    flair: [],
    champion: false,
  } as any;
}

describe('WorldOverview Component', () => {
  let mockState: GameState;

  beforeEach(() => {
    storeOverride = {};
    mockState = createFreshState('test-seed');

    // Setup player stable
    mockState.player = {
      id: 'p1' as import('@/types/shared.types').StableId,
      name: 'Player Owner',
      stableName: 'Player Stable',
      fame: 100,
      titles: 0,
      renown: 0,
    };

    mockState.roster = [
      createDummyWarrior('PlayerWarrior1', 'Active', 10, 5, 50),
      createDummyWarrior('PlayerWarrior2', 'Active', 5, 10, 20),
    ];

    // Setup rival stable
    mockState.rivals = [
      {
        owner: {
          id: 'r1',
          name: 'Rival Owner',
          stableName: 'Rival Stable',
          fame: 80,
          renown: 0,
          titles: 0,
          personality: 'Aggressive' as const,
        },
        roster: [createDummyWarrior('RivalWarrior1', 'Active', 20, 0, 90)],
      } as any,
    ];

    storeOverride = {
      roster: mockState.roster,
      rivals: mockState.rivals,
      player: mockState.player,
      fame: mockState.player.fame,
    };
  });

  it('renders stable rows correctly with aggregated stats', async () => {
    render(<WorldOverview />);

    // Use findAllByText since stable names might appear multiple times due to tooltips/links
    const playerStables = await screen.findAllByText('Player Stable');
    expect(playerStables.length).toBeGreaterThan(0);
    expect(screen.getByText(/Commanded by Player Owner/i)).toBeInTheDocument();

    const pOwner = screen.getByText(/Commanded by Player Owner/i);
    const playerRow = pOwner.closest('tr');
    if (!playerRow) throw new Error('Player row not found');
    const playerWlkCell = within(playerRow).getAllByText(/15/);
    expect(playerWlkCell.length).toBeGreaterThan(0);

    // Check Rival Stable row
    const rivalStables = await screen.findAllByText('Rival Stable');
    expect(rivalStables.length).toBeGreaterThan(0);

    const rOwner = screen.getByText(/Commanded by Rival Owner/i);
    const rivalRow = rOwner.closest('tr');
    if (!rivalRow) throw new Error('Rival row not found');
    const rivalWlkCell = within(rivalRow).getAllByText(/20/);
    expect(rivalWlkCell.length).toBeGreaterThan(0);
  });

  it('renders warrior rows correctly', async () => {
    render(<WorldOverview />);

    // Since we mocked TabsContent to always render, we can query it directly
    const pw1Elements = await screen.findAllByText('PlayerWarrior1');
    expect(pw1Elements.length).toBeGreaterThan(0);

    const rw1Elements = await screen.findAllByText('RivalWarrior1');
    expect(rw1Elements.length).toBeGreaterThan(0);

    const pw1Row = pw1Elements[0]!.closest('tr');
    if (!pw1Row) throw new Error('PW1 row not found');
    const pw1Cells = within(pw1Row).getAllByText(/Player Stable/i);
    expect(pw1Cells.length).toBeGreaterThan(0);
    expect(pw1Row).toHaveTextContent('10'); // wins
    expect(pw1Row).toHaveTextContent('5'); // losses
  });
});
