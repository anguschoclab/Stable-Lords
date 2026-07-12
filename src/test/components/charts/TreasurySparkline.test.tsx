// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { LedgerEntry } from '@/types/game';

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: unknown) => unknown) => fn,
}));

let mockState: { treasury: number; ledger: LedgerEntry[]; week: number } = {
  treasury: 1000,
  ledger: [],
  week: 1,
};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: (s: unknown) => unknown) => selector(mockState),
}));

import {
  TreasurySparkline,
  buildWeeklyPoints,
  buildSparklinePath,
} from '@/components/charts/TreasurySparkline';
import type { Viewport } from '@/components/charts/TreasurySparkline';

function makeLedger(entries: { week: number; amount: number }[]): LedgerEntry[] {
  return entries.map((e, i) => ({
    id: `le-${i}` as unknown as LedgerEntry['id'],
    week: e.week,
    label: `entry-${i}`,
    amount: e.amount,
    category: 'other',
  }));
}

describe('TreasurySparkline', () => {
  beforeEach(() => {
    mockState = { treasury: 1000, ledger: [], week: 1 };
  });

  it('renders without crashing', () => {
    const { container } = render(<TreasurySparkline />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('shows "No history yet" when < 2 points', () => {
    mockState = { treasury: 1000, ledger: [], week: 1 };
    const { container } = render(<TreasurySparkline />);
    expect(container.textContent).toContain('No history yet');
  });

  it('shows SVG sparkline when >= 2 points', () => {
    mockState = {
      treasury: 1500,
      ledger: makeLedger([
        { week: 1, amount: 100 },
        { week: 2, amount: 200 },
        { week: 3, amount: 300 },
      ]),
      week: 3,
    };
    const { container } = render(<TreasurySparkline />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows treasury amount in label', () => {
    mockState = { treasury: 1500, ledger: [], week: 1 };
    const { container } = render(<TreasurySparkline />);
    expect(container.textContent).toContain('1,500g');
  });

  it('shows positive delta with primary color', () => {
    mockState = {
      treasury: 1500,
      ledger: makeLedger([
        { week: 1, amount: 100 },
        { week: 2, amount: 500 },
      ]),
      week: 2,
    };
    const { container } = render(<TreasurySparkline />);
    const deltaEl = container.querySelector('.text-primary');
    expect(deltaEl).toBeInTheDocument();
  });

  it('shows negative delta with destructive color', () => {
    mockState = {
      treasury: 100,
      ledger: makeLedger([
        { week: 1, amount: 500 },
        { week: 2, amount: -400 },
      ]),
      week: 2,
    };
    const { container } = render(<TreasurySparkline />);
    const deltaEl = container.querySelector('.text-destructive');
    expect(deltaEl).toBeInTheDocument();
  });

  it('hides label when showLabel=false', () => {
    mockState = { treasury: 1500, ledger: [], week: 1 };
    const { container } = render(<TreasurySparkline showLabel={false} />);
    expect(container.textContent).not.toContain('1,500g');
  });

  it('applies custom className to root', () => {
    mockState = { treasury: 1000, ledger: [], week: 1 };
    const { container } = render(<TreasurySparkline className="test-cls" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('test-cls');
  });

  it('renders end dot circle when sparkline shown', () => {
    mockState = {
      treasury: 1500,
      ledger: makeLedger([
        { week: 1, amount: 100 },
        { week: 2, amount: 200 },
        { week: 3, amount: 300 },
      ]),
      week: 3,
    };
    const { container } = render(<TreasurySparkline />);
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
  });
});

describe('buildWeeklyPoints', () => {
  it('empty ledger → single point with current treasury', () => {
    const result = buildWeeklyPoints([], 5, 999);
    expect(result).toEqual([{ week: 5, value: 999 }]);
  });

  it('multi-week ledger → correct series with cumulative sums', () => {
    const ledger = makeLedger([
      { week: 1, amount: 100 },
      { week: 2, amount: 200 },
      { week: 3, amount: 300 },
    ]);
    const result = buildWeeklyPoints(ledger, 3, 0);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ week: 1, value: 100 });
    expect(result[1]).toEqual({ week: 2, value: 300 });
    expect(result[2]).toEqual({ week: 3, value: 600 });
  });
});

describe('buildSparklinePath', () => {
  const vp: Viewport = { min: 0, range: 100, H: 40, W: 200, PAD: 4 };

  it('returns empty string for < 2 points', () => {
    const result = buildSparklinePath([{ week: 1, value: 50 }], vp);
    expect(result).toBe('');
  });

  it('returns valid SVG path starting with M for 2+ points', () => {
    const result = buildSparklinePath(
      [
        { week: 1, value: 0 },
        { week: 2, value: 100 },
      ],
      vp
    );
    expect(result.startsWith('M')).toBe(true);
  });

  it('uses Viewport params correctly', () => {
    const vpLow: Viewport = { min: 0, range: 100, H: 40, W: 200, PAD: 4 };
    const vpHigh: Viewport = { min: 0, range: 100, H: 80, W: 400, PAD: 10 };
    const points = [
      { week: 1, value: 0 },
      { week: 2, value: 100 },
    ];
    const pathLow = buildSparklinePath(points, vpLow);
    const pathHigh = buildSparklinePath(points, vpHigh);
    // Different viewport dimensions should produce different paths
    expect(pathLow).not.toBe(pathHigh);
  });
});
