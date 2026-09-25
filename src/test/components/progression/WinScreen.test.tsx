// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WinScreen } from '@/components/progression/WinScreen';
import { useGameStore } from '@/state/useGameStore';
import '@/test/_setup/setup';

const wonState = {
  progression: {
    status: 'won',
    acknowledgedWin: false,
    wonYear: 1,
    wonWeek: 40,
    objectives: [
      { id: 'o1', label: 'Win the crown', description: 'desc', completed: true },
    ],
  },
  fame: 500,
  roster: [],
};

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
