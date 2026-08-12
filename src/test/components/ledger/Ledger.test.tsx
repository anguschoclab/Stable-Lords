import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TreasuryOverview } from '@/components/ledger/TreasuryOverview';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      treasury: { gold: 1000, income: 500, expenses: 200 },
      ledger: [],
      roster: [],
      arenaHistory: [],
      trainers: [],
      trainingAssignments: [],
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

describe('TreasuryOverview', () => {
  it('renders without crashing', () => {
    const { container } = render(<TreasuryOverview />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
