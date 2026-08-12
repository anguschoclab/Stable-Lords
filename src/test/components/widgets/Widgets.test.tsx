import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { SchedulingWidget } from '@/components/widgets/SchedulingWidget';
import { NextBoutWidget } from '@/components/widgets/NextBoutWidget';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      metaDrift: {
        styleWinRates: { 'Bashing Attack': { wins: 10, losses: 5, winRate: 0.67 } },
        totalFights: 15,
      },
      weather: 'Clear',
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
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
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

vi.mock('@/engine/schedulingAssistant', () => ({
  getRecommendedChallenges: () => [],
  getMatchupsToAvoid: () => [],
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
  it('renders without crashing with no recommendations', () => {
    const warrior = { id: 'w1', name: 'Test', style: 'Bashing Attack' } as never;
    const { container } = render(<SchedulingWidget warrior={warrior} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('NextBoutWidget', () => {
  it('renders without crashing with no bouts scheduled', () => {
    const { container } = render(<NextBoutWidget />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('No Bouts Scheduled')).toBeInTheDocument();
  });
});
