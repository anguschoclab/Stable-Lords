// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, CareerRecord } from '@/types/warrior.types';
import type { Owner, RivalStableData } from '@/types/state.types';
import type { CrestData } from '@/types/crest.types';

const mockPlayer: Owner = {
  id: 'player-1' as any,
  name: 'Marcus',
  stableName: 'Iron Hold',
  fame: 50,
  renown: 10,
  titles: 0,
  generation: 0,
};

function makeWarrior(
  overrides: Record<string, any> = {}
): Warrior {
  return {
    id: (overrides.id ?? 'w1') as any,
    name: overrides.name ?? 'Spartacus',
    style: FightingStyle.AimedBlow,
    attributes: {} as any,
    fame: 0,
    popularity: 0,
    titles: [],
    injuries: [],
    flair: [],
    career: { wins: 5, losses: 3, kills: 1 } as CareerRecord,
    champion: false,
    status: (overrides.status ?? 'Active') as any,
    traits: [],
    ...overrides,
  } as Warrior;
}

const mockRoster: Warrior[] = [
  makeWarrior({ id: 'w1', name: 'Spartacus', status: 'Active' }),
  makeWarrior({ id: 'w2', name: 'Deadarius', status: 'Dead' }),
];

const mockCrest: CrestData = {
  shieldShape: 'heater' as any,
  fieldType: 'solid' as any,
  primaryColor: 'crimson',
  metalColor: 'gold' as any,
  charge: {
    type: 'beast' as any,
    name: 'lion',
    posture: 'rampant' as any,
    count: 1,
  },
  generation: 0,
};

const mockRivals: RivalStableData[] = [
  {
    id: 'rival-1' as any,
    owner: {
      id: 'rival-owner-1' as any,
      name: 'Helena',
      stableName: 'Blood Keep',
      fame: 30,
      renown: 5,
      titles: 1,
      generation: 0,
    },
    fame: 30,
    roster: [makeWarrior({ id: 'rw1', name: 'Brutus', status: 'Active' })],
    treasury: 1000,
    ledger: [],
    trainingAssignments: [],
    crest: mockCrest,
  },
];

vi.mock('@/state/useGameStore', () => ({
  useBookmarks: vi.fn(() => []),
  useWorldState: vi.fn(() => ({ roster: [], isTournamentWeek: false })),
    useGameStore: vi.fn((selector?: any) => {
    const store = { player: mockPlayer, roster: mockRoster, rivals: mockRivals };
    return selector ? selector(store) : store;
  }),
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: any) => fn,
}));

vi.mock('@/components/crest', () => ({
  StableCrest: ({ crest }: any) => (
    <div data-testid="stable-crest">{crest.charge.name}</div>
  ),
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: ({ styleName }: any) => (
    <span data-testid="stat-badge">{styleName}</span>
  ),
}));

import { StableDossier } from '@/components/StableDossier';

describe('StableDossier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Stable not found." when stableId does not match any player or rival', () => {
    render(<StableDossier stableId="nonexistent" />);
    expect(screen.getByText('Stable not found.')).toBeInTheDocument();
  });

  it('shows "Stable not found." when stableName does not match any player or rival', () => {
    render(<StableDossier stableName="Nonexistent Stable" />);
    expect(screen.getByText('Stable not found.')).toBeInTheDocument();
  });

  it('shows player stable when stableId="player"', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('Iron Hold')).toBeInTheDocument();
  });

  it('shows player stable when stableName matches player.stableName', () => {
    render(<StableDossier stableName="Iron Hold" />);
    expect(screen.getByText('Iron Hold')).toBeInTheDocument();
  });

  it('shows rival stable when stableId matches rival.owner.id', () => {
    render(<StableDossier stableId="rival-owner-1" />);
    expect(screen.getByText('Blood Keep')).toBeInTheDocument();
  });

  it('shows rival stable when stableName matches rival.owner.stableName', () => {
    render(<StableDossier stableName="Blood Keep" />);
    expect(screen.getByText('Blood Keep')).toBeInTheDocument();
  });

  it('displays "Your Stable" badge for player stable', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('Your Stable')).toBeInTheDocument();
  });

  it('displays "Rival" badge for rival stable', () => {
    render(<StableDossier stableId="rival-owner-1" />);
    expect(screen.getByText('Rival')).toBeInTheDocument();
  });

  it('displays owner name in "Master: {name}" text', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('Marcus')).toBeInTheDocument();
  });

  it('displays fame value from stable.owner.fame', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('displays active roster count (filterActive filters out non-Active warriors)', () => {
    render(<StableDossier stableId="player" />);
    // 2 warriors in roster, 1 Active, 1 Dead → count = 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders roster warrior names in list', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('Spartacus')).toBeInTheDocument();
    // Deadarius is Dead, filtered out
    expect(screen.queryByText('Deadarius')).not.toBeInTheDocument();
  });

  it('renders career record "{wins}-{losses}" for each warrior', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('5-3')).toBeInTheDocument();
  });

  it('shows dashed "?" placeholder for player stable (no crest at top level)', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.getByText('?')).toBeInTheDocument();
    expect(screen.queryByTestId('stable-crest')).not.toBeInTheDocument();
  });

  it('shows StableCrest for rival stable with crest', () => {
    render(<StableDossier stableId="rival-owner-1" />);
    expect(screen.getByTestId('stable-crest')).toBeInTheDocument();
  });

  it('shows crest charge description text for rival with crest (name + posture)', () => {
    render(<StableDossier stableId="rival-owner-1" />);
    // The charge description renders as "lion (rampant)" in an italic <p>
    // Use exact text to avoid matching the StableCrest mock which also renders "lion"
    const desc = screen.getByText('lion (rampant)');
    expect(desc).toBeInTheDocument();
  });

  it('shows generation badge "G{generation}" when rival owner generation > 0 and crest present', () => {
    mockRivals[0]!.owner.generation = 3;
    render(<StableDossier stableId="rival-owner-1" />);
    expect(screen.getByText('G3')).toBeInTheDocument();
    mockRivals[0]!.owner.generation = 0;
  });

  it('does NOT show generation badge when generation is 0', () => {
    mockRivals[0]!.owner.generation = 0;
    render(<StableDossier stableId="rival-owner-1" />);
    expect(screen.queryByText(/^G\d+$/)).not.toBeInTheDocument();
  });

  it('does NOT show generation badge when crest is absent (player stable)', () => {
    render(<StableDossier stableId="player" />);
    expect(screen.queryByText(/^G\d+$/)).not.toBeInTheDocument();
  });
});
