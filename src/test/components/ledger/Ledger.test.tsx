import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TreasuryOverview } from '@/components/ledger/TreasuryOverview';
import { Chronicle } from '@/components/ledger/Chronicle';
import { InsightVault } from '@/components/ledger/InsightVault';
import { HallOfWarriors } from '@/components/ledger/HallOfWarriors';
import { YearEndRecap } from '@/components/ledger/YearEndRecap';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      treasury: { gold: 1000, income: 500, expenses: 200 },
      ledger: [],
      roster: [],
      graveyard: [],
      retired: [],
      rivalries: [],
      arenaHistory: [],
      trainers: [],
      trainingAssignments: [],
      insightTokens: [],
      week: 5,
      season: 'Spring',
      year: 1,
      isBookmarked: () => false,
      toggleBookmark: () => {},
    };
    return selector ? selector(state) : state;
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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: ({ styleName }: { styleName: string }) => <span>{styleName}</span>,
}));

describe('TreasuryOverview', () => {
  it('renders without crashing', () => {
    const { container } = render(<TreasuryOverview />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('Chronicle', () => {
  it('renders without crashing', () => {
    const { container } = render(<Chronicle />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('InsightVault', () => {
  it('renders without crashing', () => {
    const { container } = render(<InsightVault />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('HallOfWarriors', () => {
  it('renders without crashing', () => {
    const { container } = render(<HallOfWarriors />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('YearEndRecap', () => {
  it('renders without crashing', () => {
    const { container } = render(<YearEndRecap />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
