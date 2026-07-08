// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Warrior } from '@/types/game';
import { FightingStyle } from '@/types/game';

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    useGameStore: (selector?: any) => {
      const state = {
        player: {
          id: 'p1',
          name: 'Player',
          stableName: "Dragon's Hearth",
          fame: 0,
          renown: 0,
          titles: 0,
        },
        rivals: [],
        roster: [],
        graveyard: [],
        retired: [],
      };
      return selector ? selector(state) : state;
    },
    useWorldState: () => ({
      player: {
        id: 'p1',
        name: 'Player',
        stableName: "Dragon's Hearth",
        fame: 0,
        renown: 0,
        titles: 0,
      },
      rivals: [],
      roster: [],
      graveyard: [],
      retired: [],
    }),
    useShallow: (fn: any) => fn,
  };
});

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
  SheetTrigger: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}));

function createFallenWarrior(overrides?: Record<string, any>): Warrior {
  return {
    id: 'w1',
    name: 'TestWarrior',
    style: FightingStyle.AimedBlow,
    age: 25,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    fame: 150,
    popularity: 0,
    career: { wins: 10, losses: 5, kills: 3 },
    titles: [],
    injuries: [],
    flair: [],
    champion: false,
    status: 'Dead',
    deathWeek: 15,
    deathCause: 'Killed in arena',
    killedBy: 'Reaper',
    deathEvent: {
      boutId: 'b1',
      killerId: 'reaper',
      deathSummary: 'A swift strike to the neck ended it.',
      memorialTags: [],
    },
    traits: [],
    ...overrides,
  } as unknown as Warrior;
}

describe('VirtualizedFallenGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when warriors.length === 0', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    render(
      <VirtualizedFallenGrid
        warriors={[]}
        season="Spring"
        emptyTitle="No Fallen"
        emptyDesc="No warriors have fallen yet."
      />
    );
    expect(screen.getByText('No Fallen')).toBeInTheDocument();
    expect(screen.getByText('No warriors have fallen yet.')).toBeInTheDocument();
  });

  it('renders all warriors when list is small (jsdom fallback)', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    const warriors = [
      createFallenWarrior({ id: 'w1' as any, name: 'Alpha' }),
      createFallenWarrior({ id: 'w2' as any, name: 'Beta' }),
      createFallenWarrior({ id: 'w3' as any, name: 'Gamma' }),
    ];
    render(
      <VirtualizedFallenGrid
        warriors={warriors}
        season="Summer"
        emptyTitle="No Fallen"
        emptyDesc="None"
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('renders correct card content — name, style, death info, career stats, fame', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    const warrior = createFallenWarrior({
      id: 'w1' as any,
      name: 'SlainHero',
      fame: 999,
      career: { wins: 20, losses: 10, kills: 7 },
    });
    render(
      <VirtualizedFallenGrid
        warriors={[warrior]}
        season="Winter"
        emptyTitle="Empty"
        emptyDesc="None"
      />
    );
    expect(screen.getByText('SlainHero')).toBeInTheDocument();
    expect(screen.getByText(/20W-10L-7K/)).toBeInTheDocument();
    expect(screen.getByText(/999G/)).toBeInTheDocument();
    expect(screen.getByText(/Week 15/)).toBeInTheDocument();
    expect(screen.getByText(/WINTER/)).toBeInTheDocument();
  });

  it('renders WarriorLink for each warrior (clickable name)', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    const warriors = [createFallenWarrior({ id: 'w1' as any, name: 'ClickableWarrior' })];
    render(
      <VirtualizedFallenGrid
        warriors={warriors}
        season="Spring"
        emptyTitle="Empty"
        emptyDesc="None"
      />
    );
    const link = screen.getByText('ClickableWarrior').closest('button, a');
    expect(link).not.toBeNull();
  });

  it('does not crash with 200 warriors', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    const warriors = Array.from({ length: 200 }, (_, i) =>
      createFallenWarrior({ id: `w${i}` as any, name: `Warrior${i}` })
    );
    render(
      <VirtualizedFallenGrid
        warriors={warriors}
        season="Spring"
        emptyTitle="Empty"
        emptyDesc="None"
      />
    );
    expect(screen.getByText('Warrior0')).toBeInTheDocument();
  });

  it('medals section renders when warrior has gold/silver/bronze medals', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    const warrior = createFallenWarrior({
      id: 'w1' as any,
      name: 'Medalist',
      career: { wins: 30, losses: 0, kills: 10, medals: { gold: 2, silver: 1, bronze: 1 } } as any,
    });
    render(
      <VirtualizedFallenGrid
        warriors={[warrior]}
        season="Spring"
        emptyTitle="Empty"
        emptyDesc="None"
      />
    );
    expect(screen.getByText(/GOLD/)).toBeInTheDocument();
    expect(screen.getByText(/SILVER/)).toBeInTheDocument();
    expect(screen.getByText(/BRONZE/)).toBeInTheDocument();
  });

  it('medals section absent when warrior has no medals', async () => {
    const { VirtualizedFallenGrid } = await import('@/components/fallen/VirtualizedFallenGrid');
    const warrior = createFallenWarrior({
      id: 'w1' as any,
      name: 'NoMedals',
      career: { wins: 5, losses: 20, kills: 0 } as any,
    });
    const { container } = render(
      <VirtualizedFallenGrid
        warriors={[warrior]}
        season="Spring"
        emptyTitle="Empty"
        emptyDesc="None"
      />
    );
    expect(container.querySelector('[class*="GOLD"]')).toBeNull();
  });
});
