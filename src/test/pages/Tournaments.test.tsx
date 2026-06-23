// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import Tournaments from '@/pages/Tournaments';
import '@/test/_setup/setup';

// Mock useGameStore to avoid store initialization issues
vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: any) => {
    const state = {
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
      bookmarks: [],
      isBookmarked: vi.fn(() => false),
      player: {
        id: 'p1',
        name: 'Player',
        stableName: "Dragon's Hearth",
        fame: 0,
        renown: 0,
        titles: 0,
      },
    };
    return selector ? selector(state) : state;
  },
}));

// We mock @tanstack/react-router to avoid setting up a full router context
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: any) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));

// Mock context hook removed - using actual store + renderWithGameState

describe('Tournaments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No mockReturnValue needed - renderWithGameState handles it
  });

  it('renders recruit operatives button when criteria are met', () => {
    const { getByText, getByRole } = render(<Tournaments />);

    // Check main title
    expect(getByText(/Seasonal Campaigns/)).toBeDefined();

    // Check Recruit Units button is present when tournament is null
    const recruitBtn = getByRole('button', { name: /Recruit Warriors/i });
    expect(recruitBtn).toBeDefined();
  });
});
