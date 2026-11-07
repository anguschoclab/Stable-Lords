// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { LedgerEntry } from '@/types/game';

vi.mock('zustand/react/shallow', () => ({ ...__SHARED_MOCKS.useShallow }));

let mockState: { treasury: number; ledger: LedgerEntry[]; week: number } = {
  treasury: 1000,
  ledger: [],
  week: 1,
};

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: (s: unknown) => unknown) => selector(mockState),
}));

import { TreasurySparkline } from '@/components/charts/TreasurySparkline';
import {
  buildWeeklyPoints,
  buildSparklinePath,
  type Viewport,
} from '@/components/charts/treasurySparklineUtils';

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

  it('keeps only the last 12 weeks', () => {
    const ledger = makeLedger(
      Array.from({ length: 14 }, (_, i) => ({ week: i + 1, amount: 10 }))
    );
    const result = buildWeeklyPoints(ledger, 14, 140);
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ week: 3, value: 30 });
    expect(result[11]).toEqual({ week: 14, value: 140 });
  });

  it('appends the live treasury when the ledger ends before the current week', () => {
    const ledger = makeLedger([
      { week: 1, amount: 100 },
      { week: 2, amount: 50 },
    ]);
    const result = buildWeeklyPoints(ledger, 5, 999);
    expect(result[result.length - 1]).toEqual({ week: 5, value: 999 });
  });

  it('accumulates multiple entries within the same week into one point', () => {
    const ledger = makeLedger([
      { week: 1, amount: 100 },
      { week: 1, amount: 50 },
      { week: 2, amount: 200 },
    ]);
    const result = buildWeeklyPoints(ledger, 2, 0);
    expect(result).toEqual([
      { week: 1, value: 150 },
      { week: 2, value: 350 },
    ]);
  });

  // Precondition pin: entries are assumed chronological — out-of-order weeks
  // emit duplicate-week points rather than re-merging.
  it('emits duplicate-week points for out-of-order input', () => {
    const ledger = makeLedger([
      { week: 1, amount: 10 },
      { week: 2, amount: 20 },
      { week: 1, amount: 30 },
    ]);
    const result = buildWeeklyPoints(ledger, 2, 0);
    expect(result.map((p) => p.week)).toEqual([1, 2, 1, 2]);
  });

  // LedgerEntry.week/amount are required by the type — the `?? 0` guards only
  // fire on malformed (e.g. legacy persisted) data; the cast documents that.
  it('coerces missing week/amount on malformed entries', () => {
    const bad = [
      { id: 'le-x' as LedgerEntry['id'], label: 'x', category: 'other' } as LedgerEntry,
    ];
    const result = buildWeeklyPoints(bad, 3, 42);
    expect(result).toEqual([
      { week: 0, value: 0 },
      { week: 3, value: 42 },
    ]);
  });
});

// Viewport contract: `range` must be >= 1 — the caller guards range:0 via
// `max - min || 1` in TreasurySparkline. NaN coords are intentionally not
// pinned here (that would cement a broken path string).
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

  it('emits the exact M/L path for a known viewport', () => {
    expect(
      buildSparklinePath(
        [
          { week: 1, value: 0 },
          { week: 2, value: 100 },
        ],
        vp
      )
    ).toBe('M 4.0 36.0 L 196.0 4.0');
  });

  it('emits one L segment per additional point', () => {
    const three = buildSparklinePath(
      [
        { week: 1, value: 0 },
        { week: 2, value: 50 },
        { week: 3, value: 100 },
      ],
      vp
    );
    expect(three.split(' ').filter((s) => s === 'L')).toHaveLength(2);
    expect(three).toBe('M 4.0 36.0 L 100.0 20.0 L 196.0 4.0');
  });

  it('maps viewport min to the bottom edge and min+range to the top edge', () => {
    const vpShifted: Viewport = { min: 500, range: 1000, H: 40, W: 200, PAD: 4 };
    const path = buildSparklinePath(
      [
        { week: 1, value: 500 },
        { week: 2, value: 1500 },
      ],
      vpShifted
    );
    expect(path).toBe('M 4.0 36.0 L 196.0 4.0');
  });
});
