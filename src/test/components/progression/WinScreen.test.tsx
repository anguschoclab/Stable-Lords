import { describe, it, expect } from 'vitest';
import { WinScreen } from '@/components/progression/WinScreen';
import { DEFAULT_PROGRESSION } from '@/constants/progression';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { useGameStore } from '@/state/useGameStore';
import { render, screen, fireEvent } from '@testing-library/react';
import '@/test/_setup/setup';

// @vitest-environment jsdom

const wonState = {
  progression: {
    status: 'won',
    acknowledgedWin: false,
    wonYear: 1,
    wonWeek: 40,
    objectives: [{ id: 'o1', label: 'Win the crown', description: 'desc', completed: true }],
  },
  fame: 500,
  roster: [],
};

function setProgression(overrides: Partial<typeof DEFAULT_PROGRESSION>) {
  useGameStore.setState((s) => ({
    progression: { ...s.progression, ...overrides },
  }));
}

describe('WinScreen a11y (PR #985)', () => {
  it('renders nothing when win is not pending', () => {
    useGameStore.setState({ progression: { status: 'active' } } as never);
    const { container } = render(<WinScreen />);
    expect(container.firstChild).toBeNull();
  });

  it('Continue Legacy button exposes aria-label and a11y classes', () => {
    useGameStore.setState(wonState as never);
    render(<WinScreen />);
    const btn = screen.getByRole('button', { name: 'Continue Legacy' });
    expect(btn).toHaveAttribute('aria-label', 'Continue Legacy');
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('motion-reduce:transition-none');
  });

  it('New Game button exposes aria-label and a11y classes', () => {
    useGameStore.setState(wonState as never);
    render(<WinScreen />);
    const btn = screen.getByRole('button', { name: 'New Game' });
    expect(btn).toHaveAttribute('aria-label', 'New Game');
    expect(btn.className).toContain('focus-visible:ring-2');
    expect(btn.className).toContain('motion-reduce:transition-none');
  });
});

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
