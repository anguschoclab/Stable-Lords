// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, within } from '@testing-library/react';
import HallOfFame from '@/pages/HallOfFame';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { FightingStyle } from '@/types/game';
import type { GameState, FightSummary, NewsletterItem, Warrior } from '@/types/game';
import type { FightSummary as FightSummaryType } from '@/types/combat.types';
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
  awards: [],
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
  const actual = await importOriginal();
  return {
    ...actual,
  useGameStore: () => ({ ...defaultStoreState, ...storeOverride }),
}));

// Must mock the module before importing it inside components
const mockArenaHistoryAll = vi.fn((): FightSummaryType[] => []);
vi.mock('@/engine/history/arenaHistory', () => ({
  ArenaHistory: {
    all: () => mockArenaHistoryAll(),
    append: vi.fn(),
    clear: vi.fn(),
    query: vi.fn().mockReturnValue([]),
  },
}));

// Mock the router components
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

/**
 * Utility to create a dummy warrior for testing.
 * @param name - The warrior's name.
 * @param status - The warrior's status.
 * @param wins - Number of wins.
 * @param losses - Number of losses.
 * @param fame - Fame value.
 * @param overrides - Optional partial warrior properties to override defaults.
 * @returns A warrior object for testing.
 */
function createDummyWarrior(
  name: string,
  status: Warrior['status'],
  wins: number,
  losses: number,
  fame: number,
  overrides?: Partial<Warrior>
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
    ...overrides,
  } as Warrior;
}

describe('HallOfFame Component', () => {
  let mockState: GameState;

  const mockNewsletter: NewsletterItem = {
    id: 'news-1',
    week: 52,
    title: 'Year 1 Hall of Fame', // Must include "Hall of Fame"
    items: [
      'HALL OF FAME: Gladiator (AB) is inducted!',
      'DEADLIEST BLADE: Reaper earns the blood title.',
      'IRON CHAMPION: The Mountain recorded the best defense.',
    ],
  };

  const fight1: FightSummary = {
    id: 'f1' as any,
    week: 10,
    title: 'Reaper vs Victim',
    warriorIdA: 'Reaper' as any,
    warriorIdD: 'Victim' as any,
    stableIdA: 's-a' as any,
    stableIdD: 's-d' as any,
    winner: 'A',
    by: 'Kill',
    styleA: FightingStyle.LungingAttack,
    styleD: FightingStyle.AimedBlow,
    createdAt: new Date().toISOString(),
    transcript: [],
  };
  const fight2: FightSummary = {
    id: 'f2' as any,
    week: 20,
    title: 'Reaper vs Victim2',
    warriorIdA: 'Reaper' as any,
    warriorIdD: 'Victim2' as any,
    stableIdA: 's-a' as any,
    stableIdD: 's-d' as any,
    winner: 'A',
    by: 'KO',
    styleA: FightingStyle.LungingAttack,
    styleD: FightingStyle.AimedBlow,
    createdAt: new Date().toISOString(),
    transcript: [],
  };

  beforeEach(() => {
    storeOverride = {};
    mockState = createFreshState('test-seed');
    mockState.week = 53; // ensure it's past week 52 for year calculation
    mockState.newsletter = [mockNewsletter];

    mockState.roster = [
      createDummyWarrior('Gladiator' as any, 'Active', 30, 5, 150),
      createDummyWarrior('Reaper' as any, 'Active', 20, 5, 120),
      createDummyWarrior('The Mountain' as any, 'Active', 15, 0, 90),
    ];

    mockState.awards = [
      {
        year: 1,
        type: 'WARRIOR_OF_YEAR' as any,
        warriorId: 'Gladiator' as any,
        reason: 'Dominance',
        value: 100,
      },
      {
        year: 1,
        type: 'KILLER_OF_YEAR' as any,
        warriorId: 'Reaper' as any,
        reason: 'Lethality',
        value: 50,
      },
      {
        year: 1,
        type: 'CLASS_MVP' as any,
        warriorId: 'The Mountain' as any,
        reason: 'Immovable',
        value: 75,
      },
    ];

    // Setup ArenaHistory mock
    mockArenaHistoryAll.mockReturnValue([fight1, fight2]);

    storeOverride = {
      roster: mockState.roster,
      awards: mockState.awards,
      year: 1,
      week: mockState.week,
      season: mockState.season,
      newsletter: mockState.newsletter,
      graveyard: mockState.graveyard,
      retired: mockState.retired,
      rivals: mockState.rivals,
      player: mockState.player,
    };
  });

  it('renders the inductees correctly', async () => {
    const { container } = render(<HallOfFame />);

    // Check that we're showing the correct year section
    expect(within(container).getByText(/Year 1 Accolades/i)).toBeInTheDocument();

    // Check for the warriors
    expect(within(container).getAllByText('Gladiator').length).toBeGreaterThan(0);
    expect(within(container).getAllByText('Reaper').length).toBeGreaterThan(0);
    expect(within(container).getAllByText('The Mountain').length).toBeGreaterThan(0);
  });

  it('identifies and displays the best fight correctly', async () => {
    const { getAllByText } = render(<HallOfFame />);

    // Find the 'Reaper' card directly
    const reaperElements = getAllByText('Reaper');
    const reaperCard = (reaperElements[0] as HTMLElement).closest("[data-testid='inductee-card']");
    if (!reaperCard) throw new Error('Reaper card not found');

    // Within the card, look for the 'Career Peak' section block
    const greatestFightSection = within(reaperCard as HTMLElement)
      .getByText('Career Peak')
      .closest('div')?.parentElement;
    expect(greatestFightSection).not.toBeUndefined();

    if (!greatestFightSection) throw new Error('Greatest fight section not found');
    const opponent = within(greatestFightSection).getByText('Victim');
    expect(opponent).toBeInTheDocument();

    // fight2 (Victim2) shouldn't be the top
    expect(within(reaperCard as HTMLElement).queryByText(/Victim2/)).not.toBeInTheDocument();
  });
});
