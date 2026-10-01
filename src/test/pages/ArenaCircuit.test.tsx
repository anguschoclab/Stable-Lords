// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArenaCircuit from '@/pages/ArenaCircuit';
import ArenaDetail from '@/pages/ArenaDetail';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGameStore } from '@/state/useGameStore';
import { STANDARD_ARENA } from '@/data/arenas';
import type { ArenaTitle } from '@/types/state.types';
import type { StableId, WarriorId } from '@/types/shared.types';
import { makeRival, makeWarrior } from '@/test/_fixtures/factories';
import '@/test/_setup/setup';

const params = { arenaId: STANDARD_ARENA.id };

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...props }: { children?: React.ReactNode }) => <a {...props}>{children}</a>,
  useParams: () => params,
}));

const CHAMP_ID = 'w-champ' as WarriorId;

const champWarrior = () =>
  makeWarrior({
    id: CHAMP_ID,
    name: 'Aurelia the Bold',
    career: { wins: 9, losses: 1, kills: 2, byArena: {} },
  });

function title(partial: Partial<ArenaTitle> = {}): ArenaTitle {
  return {
    champion: null,
    status: 'active',
    history: [],
    refusals: 0,
    deferrals: 0,
    noContenderStreak: 0,
    declinedContenders: {},
    ...partial,
  };
}

function seed(partial: Record<string, unknown> = {}) {
  useGameStore.setState({
    roster: [champWarrior()],
    rivals: [],
    arenaHistory: [],
    player: { id: 'p1', name: 'Player', stableName: 'Test Stable', fame: 0, renown: 0 },
    arenaChampions: {},
    week: 15,
    year: 1,
    absoluteWeek: 15,
    ...partial,
  } as never);
}

describe('ArenaCircuit', () => {
  beforeEach(() => seed());

  it('renders a card per arena with TITLE VACANT where no reign exists', () => {
    render(<ArenaCircuit />);
    expect(screen.getByText(STANDARD_ARENA.name)).toBeInTheDocument();
    expect(screen.getAllByText('TITLE VACANT').length).toBeGreaterThan(0);
  });

  it('shows the reigning champion and their stable on the card', () => {
    seed({
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 10,
            defenses: 2,
            lastActivityWeek: 14,
          },
        }),
      },
    });
    render(<ArenaCircuit />);
    expect(screen.getByText('Aurelia the Bold')).toBeInTheDocument();
    expect(screen.getByText('Test Stable')).toBeInTheDocument();
    expect(screen.getByText('CHAMPION')).toBeInTheDocument();
    expect(screen.getByText('2 DEF')).toBeInTheDocument();
  });

  it('shows DORMANT and RE-ENGAGING badges derived from title status', () => {
    seed({
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          status: 'dormant',
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 5,
            defenses: 0,
            lastActivityWeek: 14,
          },
        }),
      },
    });
    const { unmount } = render(<ArenaCircuit />);
    expect(screen.getByText('DORMANT')).toBeInTheDocument();
    unmount();

    seed({
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          status: 'pendingReengagement',
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 5,
            defenses: 0,
            lastActivityWeek: 14,
          },
        }),
      },
    });
    render(<ArenaCircuit />);
    expect(screen.getByText('RE-ENGAGING')).toBeInTheDocument();
  });
});

describe('ArenaDetail', () => {
  beforeEach(() => seed());

  it('renders the unknown-arena guard for a bad id', () => {
    params.arenaId = 'not_a_real_arena';
    render(
      <TooltipProvider>
        <ArenaDetail />
      </TooltipProvider>
    );
    expect(screen.getByText('Unknown Arena')).toBeInTheDocument();
    expect(screen.getByText(/does not exist in the circuit/)).toBeInTheDocument();
    params.arenaId = STANDARD_ARENA.id;
  });

  it('shows the champion block and four record boards for a real arena', () => {
    seed({
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 10,
            defenses: 1,
            lastActivityWeek: 14,
          },
          history: [
            {
              warriorId: 'w-old' as WarriorId,
              warriorName: 'Old King',
              stableName: 'Fallen Stable',
              startedAbsoluteWeek: 2,
              endedAbsoluteWeek: 8,
              endReason: 'died',
              defenses: 0,
            },
          ],
        }),
      },
    });
    render(
      <TooltipProvider>
        <ArenaDetail />
      </TooltipProvider>
    );
    expect(screen.getByText(STANDARD_ARENA.name)).toBeInTheDocument();
    expect(screen.getByText('Arena Champion')).toBeInTheDocument();
    expect(screen.getByText('Aurelia the Bold')).toBeInTheDocument();
    expect(screen.getByText('Top Warriors')).toBeInTheDocument();
    expect(screen.getByText('Top Executioners')).toBeInTheDocument();
    expect(screen.getByText('Best in Class')).toBeInTheDocument();
    expect(screen.getByText('Best Stable')).toBeInTheDocument();
    expect(screen.getByText('Old King')).toBeInTheDocument();
  });

  it('offers Relinquish Crown only for a player-owned champion and calls the action', () => {
    const spy = vi.fn();
    seed({
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 10,
            defenses: 0,
            lastActivityWeek: 14,
          },
        }),
      },
      relinquishArenaTitle: spy,
    });
    render(
      <TooltipProvider>
        <ArenaDetail />
      </TooltipProvider>
    );
    const btn = screen.getByRole('button', { name: 'Relinquish Crown' });
    fireEvent.click(btn);
    fireEvent.click(screen.getByRole('button', { name: 'Relinquish' }));
    expect(spy).toHaveBeenCalledWith(STANDARD_ARENA.id);
  });

  it('hides Relinquish Crown when the champion belongs to a rival', () => {
    seed({
      roster: [],
      rivals: [
        makeRival({
          id: 'r1' as StableId,
          roster: [champWarrior()],
        }),
      ],
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 10,
            defenses: 0,
            lastActivityWeek: 14,
          },
        }),
      },
    });
    render(
      <TooltipProvider>
        <ArenaDetail />
      </TooltipProvider>
    );
    expect(screen.getByText('Aurelia the Bold')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Relinquish Crown' })).not.toBeInTheDocument();
  });

  it('the store action clears the champion and stamps the ex-champion cooldown', () => {
    seed({
      arenaChampions: {
        [STANDARD_ARENA.id]: title({
          champion: {
            warriorId: CHAMP_ID,
            startedAbsoluteWeek: 10,
            defenses: 0,
            lastActivityWeek: 14,
          },
        }),
      },
    });
    useGameStore.getState().relinquishArenaTitle(STANDARD_ARENA.id);
    const t = useGameStore.getState().arenaChampions[STANDARD_ARENA.id]!;
    expect(t.champion).toBeNull();
    expect(t.history.at(-1)?.endReason).toBe('relinquished');
    expect(t.declinedContenders[CHAMP_ID]).toBeGreaterThan(15);
  });
});
