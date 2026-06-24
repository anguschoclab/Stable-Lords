// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HallOfFights } from '@/lore/HallOfFights';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { FightingStyle } from '@/types/game';
import type { GameState, FightSummary } from '@/types/game';
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
vi.mock('@/state/useGameStore', () => ({
  useBookmarks: vi.fn(() => []),
    useGameStore: () => ({ ...defaultStoreState, ...storeOverride }),
  useWorldState: () => ({ ...defaultStoreState, ...storeOverride }),
}));

// Must mock the module before importing it inside components
vi.mock('@/lore/LoreArchive', () => {
  return {
    LoreArchive: {
      allHall: vi.fn().mockReturnValue([]),
      allFights: vi.fn().mockReturnValue([]),
      signalFight: vi.fn(),
      markFightOfWeek: vi.fn(),
      markFightOfTournament: vi.fn(),
    },
  };
});

import { LoreArchive } from '@/lore/LoreArchive';

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

describe('HallOfFights Component', () => {
  let mockState: GameState;

  const fight1: FightSummary = {
    id: 'f1' as any,
    week: 10,
    title: 'Fighter A vs Fighter B',
    warriorIdA: 'wa1' as any,
    warriorIdD: 'wa2' as any,
    stableIdA: 'sa' as any,
    stableIdD: 'sb' as any,
    winner: 'A',
    by: 'Kill',
    styleA: FightingStyle.LungingAttack,
    styleD: FightingStyle.AimedBlow,
    createdAt: new Date().toISOString(),
  };
  const fight2: FightSummary = {
    id: 'f2' as any,
    week: 10,
    title: 'Fighter C vs Fighter D',
    warriorIdA: 'wa3' as any,
    warriorIdD: 'wa4' as any,
    stableIdA: 'sc' as any,
    stableIdD: 'sd' as any,
    winner: 'D',
    by: 'KO',
    styleA: FightingStyle.LungingAttack,
    styleD: FightingStyle.AimedBlow,
    createdAt: new Date().toISOString(),
  };
  const fight3: FightSummary = {
    id: 'f3' as any,
    week: 11,
    title: 'Fighter E vs Fighter F',
    warriorIdA: 'wa5' as any,
    warriorIdD: 'wa6' as any,
    stableIdA: 'se' as any,
    stableIdD: 'sf' as any,
    winner: 'A',
    by: 'Kill',
    styleA: FightingStyle.BashingAttack,
    styleD: FightingStyle.TotalParry,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    storeOverride = {};
    mockState = createFreshState('test-seed');
    mockState.arenaHistory = [fight1, fight2, fight3];
    storeOverride = { arenaHistory: mockState.arenaHistory, week: mockState.week };

    // Setup LoreArchive mock for hall entries
    const mockAllHall = LoreArchive.allHall as any;
    mockAllHall.mockReturnValue([{ week: 10, label: 'Fight of the Week', fightId: 'f1' }]);
  });

  it('groups and displays fights from the arenaHistory by week correctly', async () => {
    render(
      <TooltipProvider>
        <HallOfFights />
      </TooltipProvider>
    );

    // There should be section for week 11 and week 10
    const week10Headers = await screen.findAllByText(/Week 10/);
    const week11Headers = await screen.findAllByText(/Week 11/);
    expect(week10Headers.length).toBeGreaterThan(0);
    expect(week11Headers.length).toBeGreaterThan(0);

    // Find fight 1 (split by span elements, so query by regex)
    expect((await screen.findAllByText(/Fighter A/)).length).toBeGreaterThan(0);

    // Find fight 2
    expect((await screen.findAllByText(/Fighter C/)).length).toBeGreaterThan(0);

    // Find fight 3
    expect((await screen.findAllByText(/Fighter E/)).length).toBeGreaterThan(0);
  });

  it('renders style stats correctly based on arena history', async () => {
    render(
      <TooltipProvider>
        <HallOfFights />
      </TooltipProvider>
    );

    // We mocked TabsContent so all tabs' content is rendered into the DOM
    // The table should list styles from the fights
    // Lunging Attack, Aimed-Blow, Basher, Total-Parry
    const lungerText = await screen.findAllByText(/Lunger/i);
    expect(lungerText.length).toBeGreaterThan(0);

    const abText = await screen.findAllByText(/Aimed-Blow/i);
    expect(abText.length).toBeGreaterThan(0);

    // Assert row stats for Lunger
    // Fought 2 times, won both, 100% win rate
    const lungerRow = lungerText[0]!.closest('tr');
    expect(lungerRow).toBeInTheDocument();
    if (!lungerRow) throw new Error('Lunger row not found');
    const lungerCells = within(lungerRow).getAllByRole('cell');
    // Order: Style, Fights, Wins, Losses, Kills, WinRate
    expect(lungerCells[1]).toHaveTextContent('2'); // fights
    expect(lungerCells[2]).toHaveTextContent('1'); // wins  (A won fight1, D won fight2)
    expect(lungerCells[3]).toHaveTextContent('1'); // losses
    expect(lungerCells[5]).toHaveTextContent('50%'); // win rate
  });
});
