import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WinScreen } from '@/components/progression/WinScreen';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import '@/test/_setup/setup';

function setProgression(overrides: Partial<typeof DEFAULT_PROGRESSION>) {
  useGameStore.setState((s) => ({
    progression: { ...s.progression, ...overrides },
  }));
}

describe('WinScreen', () => {
  it('returns null when status is active', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);
    setProgression({ status: 'active' });

    const { container } = render(<WinScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when status is continued', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);
    setProgression({ status: 'continued', acknowledgedWin: true });

    const { container } = render(<WinScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when acknowledgedWin is true', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);
    setProgression({ status: 'won', acknowledgedWin: true });

    const { container } = render(<WinScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when status is won and not acknowledged', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);
    setProgression({
      status: 'won',
      wonYear: 3,
      wonWeek: 52,
      acknowledgedWin: false,
    });

    render(<WinScreen />);
    expect(screen.getByText('Realm Champion')).toBeTruthy();
  });

  it('Continue Legacy button calls acknowledgeWin', () => {
    const mockState = createFreshState('test-seed');
    useGameStore.getState().loadGame('test-slot', mockState);
    setProgression({
      status: 'won',
      wonYear: 3,
      wonWeek: 52,
      acknowledgedWin: false,
    });

    render(<WinScreen />);
    const button = screen.getByText('Continue Legacy');
    fireEvent.click(button);

    expect(useGameStore.getState().progression.status).toBe('continued');
    expect(useGameStore.getState().progression.acknowledgedWin).toBe(true);
  });
});
