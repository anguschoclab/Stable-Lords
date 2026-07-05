// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { DerivedRivalry } from '@/types/rivalry.types';

const mockRivalriesList = vi.fn<(state: unknown) => DerivedRivalry[]>();
const mockMostWantedRival = vi.fn<(state: unknown) => { name: string; stable: string; wins: number; kills: number } | null>();

vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ roster: [], graveyard: [], rivals: [], arenaHistory: [], week: 1 })
  ),
  useShallow: (fn: (s: unknown) => unknown) => fn,
}));

vi.mock('@/hooks/useRivalries', () => ({
  usePlayerRosterIds: vi.fn(() => new Set()),
  useRivalWarriorStable: vi.fn(() => new Map()),
  useRivalriesList: (...args: unknown[]) => mockRivalriesList(args[0]),
  useMostWantedRival: (...args: unknown[]) => mockMostWantedRival(args[0]),
}));

import { RivalryWidget } from '@/components/dashboard/RivalryWidget';

function makeRivalry(overrides: Partial<DerivedRivalry> = {}): DerivedRivalry {
  return {
    stableName: 'Iron Wolves',
    ownerId: 'owner-1',
    intensity: 3,
    kills: [],
    bouts: 10,
    playerWins: 6,
    playerLosses: 4,
    ...overrides,
  };
}

describe('RivalryWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRivalriesList.mockReturnValue([]);
    mockMostWantedRival.mockReturnValue(null);
  });

  it('renders empty state when no rivalries', () => {
    render(<RivalryWidget />);
    expect(screen.getByText(/No significant vendettas detected/i)).toBeInTheDocument();
  });

  it('renders active feud count badge with correct number', () => {
    mockRivalriesList.mockReturnValue([
      makeRivalry({ ownerId: 'owner-1' }),
      makeRivalry({ ownerId: 'owner-2' }),
    ]);
    render(<RivalryWidget />);
    expect(screen.getByText('2 ACTIVE FEUDS')).toBeInTheDocument();
  });

  it('renders at most 4 RivalryCards', () => {
    mockRivalriesList.mockReturnValue([
      makeRivalry({ stableName: 'Stable One', ownerId: 'owner-1' }),
      makeRivalry({ stableName: 'Stable Two', ownerId: 'owner-2' }),
      makeRivalry({ stableName: 'Stable Three', ownerId: 'owner-3' }),
      makeRivalry({ stableName: 'Stable Four', ownerId: 'owner-4' }),
      makeRivalry({ stableName: 'Stable Five', ownerId: 'owner-5' }),
    ]);
    render(<RivalryWidget />);
    expect(screen.getByText('Stable One')).toBeInTheDocument();
    expect(screen.getByText('Stable Two')).toBeInTheDocument();
    expect(screen.getByText('Stable Three')).toBeInTheDocument();
    expect(screen.getByText('Stable Four')).toBeInTheDocument();
    expect(screen.queryByText('Stable Five')).not.toBeInTheDocument();
  });

  it('renders MostWantedBanner when mostWanted is non-null and rivalries exist', () => {
    mockRivalriesList.mockReturnValue([makeRivalry()]);
    mockMostWantedRival.mockReturnValue({
      name: 'Brutus',
      stable: 'Iron Wolves',
      wins: 5,
      kills: 2,
    });
    render(<RivalryWidget />);
    expect(screen.getByText(/High Priority Target/i)).toBeInTheDocument();
    expect(screen.getByText('Brutus')).toBeInTheDocument();
  });

  it('does not render MostWantedBanner when mostWanted is null', () => {
    mockRivalriesList.mockReturnValue([makeRivalry()]);
    mockMostWantedRival.mockReturnValue(null);
    render(<RivalryWidget />);
    expect(screen.queryByText(/High Priority Target/i)).not.toBeInTheDocument();
  });

  it('renders Access Conflict Archives button', () => {
    render(<RivalryWidget />);
    expect(screen.getByRole('button', { name: /Access Conflict Archives/i })).toBeInTheDocument();
  });
});
