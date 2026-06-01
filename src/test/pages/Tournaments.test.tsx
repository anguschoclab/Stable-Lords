// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tournaments from '@/pages/Tournaments';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import type { GameState } from '@/types/game';
import '@/test/setup';

// Mock useGameStore to avoid store initialization issues
vi.mock('@/state/useGameStore', () => ({
  useGameStore: () => ({
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
  }),
}));

// We mock @tanstack/react-router to avoid setting up a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock context hook removed - using actual store + renderWithGameState

describe('Tournaments Page', () => {
  const mockSetState = vi.fn();

  const mockActiveWarrior = {
    id: 'w1',
    name: 'Grom',
    status: 'Active',
    style: 'Bash Artist',
    fame: 85, // High fame to trigger FE freeze warning
    career: { wins: 5, losses: 1, kills: 0 },
  };

  const mockActiveWarrior2 = {
    id: 'w2',
    name: 'Thor',
    status: 'Active',
    style: 'Parry Riposte',
    fame: 40,
    career: { wins: 2, losses: 2, kills: 0 },
  };

  const mockState = {
    week: 1,
    season: 'Spring' as const,
    roster: [mockActiveWarrior],
    tournaments: [],
    rivals: [],
    treasury: 1000,
    fame: 10,
    lastSimulationReport: null,
    newsletter: [],
    gazettes: [],
    awards: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // No mockReturnValue needed - renderWithGameState handles it
  });

  it('renders recruit operatives button when criteria are met', () => {
    const { getByText, getByRole } = render(<Tournaments />);

    // Check main title
    expect(getByText(/Seasonal Campaigns/)).toBeDefined();

    // Check Recruit Units button is present when tournament is null
    const recruitBtn = getByRole('button', { name: /RECRUIT UNITS/i });
    expect(recruitBtn).toBeDefined();
  });
});
