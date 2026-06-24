import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObjectivesWidget } from '@/components/dashboard/ObjectivesWidget';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import '@/test/_setup/setup';

function setProgression(overrides: Partial<typeof DEFAULT_PROGRESSION>) {
  useGameStore.setState((s) => ({
    progression: { ...s.progression, ...overrides },
  }));
}

describe('ObjectivesWidget', () => {
  it('renders all 5 objectives', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);

    render(<ObjectivesWidget />);

    expect(screen.getByText('Reach Top 10')).toBeTruthy();
    expect(screen.getByText('Reach Top 3')).toBeTruthy();
    expect(screen.getByText('Tournament Victor')).toBeTruthy();
    expect(screen.getByText('Hall of Famer')).toBeTruthy();
    expect(screen.getByText('Realm Champion')).toBeTruthy();
  });

  it('shows standing text when totalStables > 0', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);
    setProgression({ stableStanding: 3, totalStables: 11 });

    render(<ObjectivesWidget />);

    expect(screen.getByText('#3 of 11')).toBeTruthy();
  });

  it('shows Unranked when totalStables is 0', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);

    render(<ObjectivesWidget />);

    expect(screen.getByText('Unranked')).toBeTruthy();
  });
});
