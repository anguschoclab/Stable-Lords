// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArenaLeaderboards from '@/pages/ArenaLeaderboards';
import { useGameStore } from '@/state/useGameStore';
import { STANDARD_ARENA } from '@/data/arenas';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children?: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

const defaultStoreState = {
  roster: [],
  rivals: [],
  arenaHistory: [],
  graveyard: [],
  retired: [],
  player: {
    id: 'p1',
    name: 'Player',
    stableName: 'Test Stable',
    fame: 0,
    renown: 0,
  },
};

describe('ArenaLeaderboards', () => {
  it('shows recent bouts only for the selected arena', () => {
    useGameStore.setState({
      ...defaultStoreState,
      arenaHistory: [
        {
          id: 'f1',
          arenaId: STANDARD_ARENA.id,
          title: 'Bout At Selected Arena',
          winner: 'A',
          by: 'KO',
          week: 3,
          warriorIdA: 'w1',
          warriorIdD: 'w2',
        },
        {
          id: 'f2',
          arenaId: 'other_arena',
          title: 'Bout At Other Arena',
          winner: 'D',
          by: 'Kill',
          week: 3,
          warriorIdA: 'w3',
          warriorIdD: 'w4',
        },
      ],
    } as never);

    render(<ArenaLeaderboards />);

    expect(screen.getByText('Bout At Selected Arena')).toBeInTheDocument();
    expect(screen.queryByText('Bout At Other Arena')).not.toBeInTheDocument();
  });

  it('surfaces arena lore for the selected venue (C3)', () => {
    useGameStore.setState({ ...defaultStoreState } as never);
    render(<ArenaLeaderboards />);
    fireEvent.click(screen.getByRole('button', { name: 'The Mudpit' }));
    expect(screen.getByText('The Drowning Grasp')).toBeInTheDocument();
  });
});

