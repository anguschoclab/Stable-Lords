// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { QuadrantDot } from '@/hooks/useQuadrantDots';

vi.mock('zustand/react/shallow', () => ({
  useShallow: (fn: (s: unknown) => unknown) => fn,
}));

let mockState: { rivals: unknown[] } = { rivals: [] };
let mockWorldState: unknown = {};
let mockDots: QuadrantDot[] = [];

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector: (s: unknown) => unknown) => selector(mockState),
}));

vi.mock('@/state/selectors', () => ({
  useReputationState: () => mockWorldState,
}));

vi.mock('@/hooks/useQuadrantDots', () => ({
  useQuadrantDots: () => mockDots,
}));

import { ReputationQuadrant } from '@/components/charts/ReputationQuadrant';

describe('ReputationQuadrant', () => {
  beforeEach(() => {
    mockState = { rivals: [] };
    mockWorldState = {};
    mockDots = [];
  });

  it('renders without crashing', () => {
    mockDots = [{ label: 'Player', fame: 50, notoriety: 30, isPlayer: true }];
    const { container } = render(<ReputationQuadrant />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders "Reputation Quadrant" header text', () => {
    mockDots = [{ label: 'Player', fame: 50, notoriety: 30, isPlayer: true }];
    const { container } = render(<ReputationQuadrant />);
    expect(container.textContent).toContain('Reputation Quadrant');
  });

  it('renders "You" legend item', () => {
    mockDots = [{ label: 'Player', fame: 50, notoriety: 30, isPlayer: true }];
    const { container } = render(<ReputationQuadrant />);
    expect(container.textContent).toContain('You');
  });

  it('renders "Rivals" legend item', () => {
    mockDots = [{ label: 'Player', fame: 50, notoriety: 30, isPlayer: true }];
    const { container } = render(<ReputationQuadrant />);
    expect(container.textContent).toContain('Rivals');
  });

  it('renders player dot indicator with bg-primary in legend', () => {
    mockDots = [{ label: 'Player', fame: 50, notoriety: 30, isPlayer: true }];
    const { container } = render(<ReputationQuadrant />);
    const primaryEl = container.querySelector('.bg-primary');
    expect(primaryEl).toBeInTheDocument();
  });

  it('renders rival dot indicator with bg-white/20 in legend', () => {
    mockDots = [{ label: 'Player', fame: 50, notoriety: 30, isPlayer: true }];
    const { container } = render(<ReputationQuadrant />);
    const rivalIndicator = container.querySelector('.bg-white\\/20');
    expect(rivalIndicator).toBeInTheDocument();
  });

  it('renders dots from useQuadrantDots — 3 dots → 3 dot elements', () => {
    mockDots = [
      { label: 'Player', fame: 50, notoriety: 30, isPlayer: true },
      { label: 'Rival A', fame: 40, notoriety: 60, isPlayer: false },
      { label: 'Rival B', fame: 20, notoriety: 10, isPlayer: false },
    ];
    const { container } = render(<ReputationQuadrant />);
    // Each QuadrantDotItem renders a positioned div inside QuadrantPlot
    // Player dot uses bg-primary, rival dots use bg-white/30
    const playerDots = container.querySelectorAll('.bg-primary');
    const rivalDots = container.querySelectorAll('.bg-white\\/30');
    // Legend has 1 bg-primary (the "You" indicator), plus 1 player dot
    expect(playerDots.length).toBeGreaterThanOrEqual(2);
    // 2 rival dots
    expect(rivalDots.length).toBe(2);
  });

  it('zero dots → no positioned dot elements inside plot', () => {
    mockDots = [];
    const { container } = render(<ReputationQuadrant />);
    // No bg-white/30 dots should exist (only the legend bg-white/20 indicator)
    const rivalDots = container.querySelectorAll('.bg-white\\/30');
    expect(rivalDots.length).toBe(0);
  });

  it('applies custom className to root Surface', () => {
    mockDots = [];
    const { container } = render(<ReputationQuadrant className="test-cls" />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass('test-cls');
  });

  it('renders axis labels from QuadrantPlot', () => {
    mockDots = [];
    const { container } = render(<ReputationQuadrant />);
    expect(container.textContent).toContain('Fame');
    expect(container.textContent).toContain('Notoriety');
  });

  it('renders quadrant labels from QuadrantPlot', () => {
    mockDots = [];
    const { container } = render(<ReputationQuadrant />);
    expect(container.textContent).toContain('Feared');
    expect(container.textContent).toContain('Legendary');
    expect(container.textContent).toContain('Unknown');
    expect(container.textContent).toContain('Celebrated');
  });
});
