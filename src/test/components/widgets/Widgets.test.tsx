import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MetaDriftWidget } from '@/components/widgets/MetaDriftWidget';

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      metaDrift: {
        styleWinRates: { 'Bashing Attack': { wins: 10, losses: 5, winRate: 0.67 } },
        totalFights: 15,
      },
    };
    return selector ? selector(state) : state;
  },
  useWorldState: () => ({}),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) => <div {...props}>{children}</div>,
  },
}));

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: Record<string, unknown>) => unknown) => fn,
}));

describe('MetaDriftWidget', () => {
  it('renders without crashing', () => {
    const { container } = render(<MetaDriftWidget />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
