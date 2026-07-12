import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockStore = vi.hoisted(() => ({ roster: [] as any[] }));

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (state: any) => any) =>
    selector ? selector(mockStore) : mockStore,
}));

import PhysicalsSimulator from '@/pages/PhysicalsSimulator';

// Mocking getBoundingClientRect for Radix UI select and slider
// This is often needed in JSDOM when rendering complex UI components
beforeAll(() => {
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
});

describe('PhysicalsSimulator Page', () => {
  it('renders correctly', () => {
    render(<PhysicalsSimulator />);

    // Check main title
    expect(screen.getByText('Physicals Simulator')).toBeDefined();

    // Check if both fighters are listed
    const isCardTitle = (content: string, element: Element | null) =>
      element?.tagName === 'H3' && content === 'Fighter A';
    const isCardTitleB = (content: string, element: Element | null) =>
      element?.tagName === 'H3' && content === 'Fighter B';
    expect(screen.getByText(isCardTitle)).toBeDefined();
    expect(screen.getByText(isCardTitleB)).toBeDefined();

    // Check if simulation results area exists
    expect(screen.getByText(/SIMULATION RESULTS/i)).toBeDefined();
  });

  it('calculates initial stats properly for both fighters', () => {
    render(<PhysicalsSimulator />);

    // Find Fighter A's analysis section
    expect(screen.getByText('Fighter A Analysis')).toBeDefined();
    expect(screen.getByText('Fighter B Analysis')).toBeDefined();

    // Check that numeric stat values exist
    const numElements = screen.getAllByText(/\d+/);
    expect(numElements.length).toBeGreaterThan(0);
  });
});

describe('PhysicalsSimulator active roster filtering', () => {
  it('renders active warriors but not inactive warriors in selectors', () => {
    const active = { id: 'active1', name: 'Active Warrior', status: 'Active' };
    const dead = { id: 'dead1', name: 'Dead Warrior', status: 'Dead' };

    mockStore.roster = [active, dead];

    render(<PhysicalsSimulator />);

    expect(screen.queryByText('Active Warrior')).toBeInTheDocument();
    expect(screen.queryByText('Dead Warrior')).not.toBeInTheDocument();
  });
});
