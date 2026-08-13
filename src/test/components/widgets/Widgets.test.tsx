import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { SchedulingWidget } from '@/components/widgets/SchedulingWidget';
import { NextBoutWidget } from '@/components/widgets/NextBoutWidget';

const mockToggleChallenge = vi.fn();
const mockToggleAvoid = vi.fn();
let mockPlayerChallenges: string[] = [];
let mockPlayerAvoids: string[] = [];

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      metaDrift: {
        styleWinRates: { 'Bashing Attack': { wins: 10, losses: 5, winRate: 0.67 } },
        totalFights: 15,
      },
      weather: 'Clear',
      playerChallenges: mockPlayerChallenges,
      playerAvoids: mockPlayerAvoids,
      toggleChallenge: mockToggleChallenge,
      toggleAvoid: mockToggleAvoid,
    };
    return selector ? selector(state) : state;
  },
  useWorldState: () => ({
    tournaments: [],
    rivals: [],
    roster: [],
    player: { id: 'p1', stableName: 'MyStable' },
    warriors: [],
    stables: [],
    playerChallenges: mockPlayerChallenges,
    playerAvoids: mockPlayerAvoids,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: Record<string, unknown>) => unknown) => fn,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

const mockRecommendation = {
  playerWarriorId: 'w1',
  rivalWarrior: { id: 'rival1', name: 'Spartacus', style: 'Bashing Attack' },
  rivalStableName: 'Enemy Stable',
  score: 150,
  styleAdvantage: 10,
  fameDiff: 5,
  notes: ['Style advantage'],
};

const mockAvoid = {
  playerWarriorId: 'w1',
  rivalWarrior: { id: 'rival2', name: 'Brutus', style: 'Striking Attack' },
  rivalStableName: 'Rival Stable',
  score: 50,
  styleAdvantage: -10,
  fameDiff: -5,
  notes: ['Style disadvantage'],
};

vi.mock('@/engine/schedulingAssistant', () => ({
  getRecommendedChallenges: () => [mockRecommendation],
  getMatchupsToAvoid: () => [mockAvoid],
}));

vi.mock('@/engine/core/historyResolver', () => ({
  resolveWarriorName: () => 'Unknown',
  resolveStableName: () => 'Unknown',
  findWarrior: () => undefined,
}));

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/SectionDivider', () => ({
  SectionDivider: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock('@/constants/arena/weather', () => ({
  getWeatherConfig: () => ({
    icon: () => null,
    description: 'Clear skies',
    borderClass: '',
    bgClass: '',
    colorClass: '',
  }),
}));

describe('MetaDriftWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(<MetaDriftWidget />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('WeatherWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(<WeatherWidget />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders weather badge', () => {
    render(<WeatherWidget />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });
});

describe('SchedulingWidget', () => {
  beforeEach(() => {
    mockToggleChallenge.mockClear();
    mockToggleAvoid.mockClear();
    mockPlayerChallenges = [];
    mockPlayerAvoids = [];
  });

  it('renders without crashing with no recommendations', () => {
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    const { container } = render(<SchedulingWidget warrior={warrior} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders Challenge button on recommendation cards', () => {
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    render(<SchedulingWidget warrior={warrior} />);
    expect(screen.getAllByText('Challenge')).toHaveLength(2);
  });

  it('renders Avoid button on avoid cards', () => {
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    render(<SchedulingWidget warrior={warrior} />);
    expect(screen.getAllByText('Avoid')).toHaveLength(2);
  });

  it('calls toggleChallenge with rivalWarrior.id when Challenge button clicked', () => {
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    render(<SchedulingWidget warrior={warrior} />);
    fireEvent.click(screen.getAllByText('Challenge')[0]!);
    expect(mockToggleChallenge).toHaveBeenCalledWith('rival1');
  });

  it('calls toggleAvoid with rivalWarrior.id when Avoid button clicked', () => {
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    render(<SchedulingWidget warrior={warrior} />);
    fireEvent.click(screen.getAllByText('Avoid')[1]!);
    expect(mockToggleAvoid).toHaveBeenCalledWith('rival2');
  });

  it('shows Challenged text when warrior is already challenged', () => {
    mockPlayerChallenges = ['rival1'];
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    render(<SchedulingWidget warrior={warrior} />);
    expect(screen.getByText('Challenged')).toBeInTheDocument();
  });

  it('shows Avoided text when warrior is already avoided', () => {
    mockPlayerAvoids = ['rival2'];
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    render(<SchedulingWidget warrior={warrior} />);
    expect(screen.getByText('Avoided')).toBeInTheDocument();
  });
});

describe('NextBoutWidget', () => {
  it('renders without crashing with no bouts scheduled', () => {
    const { container } = render(<NextBoutWidget />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('No Bouts Scheduled')).toBeInTheDocument();
  });
});
