// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TacticalLogView from '@/components/arena/TacticalLogView';
import type { MinuteEvent } from '@/types/game';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';

// jsdom doesn't implement scrollIntoView — mock it so useEffect doesn't throw
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockLog: MinuteEvent[] = [
  { minute: 1, text: 'Warrior A strikes Warrior B for 5 damage' },
  { minute: 2, text: 'Warrior B lands a devastating blow' },
  { minute: 3, text: 'Warrior A is slain' },
  { minute: 4, text: 'Warrior B executes a riposte' },
  { minute: 5, text: 'The crowd roars' },
];

describe('TacticalLogView', () => {
  it('renders all log events', () => {
    render(<TacticalLogView log={mockLog} visibleCount={mockLog.length} />);
    expect(screen.getByText('Warrior A strikes Warrior B for 5 damage')).toBeInTheDocument();
    expect(screen.getByText('Warrior B lands a devastating blow')).toBeInTheDocument();
    expect(screen.getByText('Warrior A is slain')).toBeInTheDocument();
    expect(screen.getByText('Warrior B executes a riposte')).toBeInTheDocument();
    expect(screen.getByText('The crowd roars')).toBeInTheDocument();
  });

  it('renders empty-state placeholder when log is empty', () => {
    render(<TacticalLogView log={[]} visibleCount={0} />);
    expect(screen.getByText('The battle is about to begin...')).toBeInTheDocument();
  });

  it('does not render step controls by default', () => {
    render(<TacticalLogView log={mockLog} visibleCount={mockLog.length} />);
    expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument();
  });

  it('renders step controls when showStepControls is true', () => {
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={0}
        onHighlightChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('disables Prev button at index 0', () => {
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={0}
        onHighlightChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('disables Next button at last index', () => {
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={mockLog.length - 1}
        onHighlightChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('Next button calls onHighlightChange with incremented index', () => {
    const onHighlightChange = vi.fn();
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={2}
        onHighlightChange={onHighlightChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(onHighlightChange).toHaveBeenCalledWith(3);
  });

  it('Prev button calls onHighlightChange with decremented index', () => {
    const onHighlightChange = vi.fn();
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={3}
        onHighlightChange={onHighlightChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(onHighlightChange).toHaveBeenCalledWith(2);
  });

  it('Prev button is disabled at index 0 (clamps to 0)', () => {
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={0}
        onHighlightChange={vi.fn()}
      />
    );
    // Prev is disabled at 0 — boundary is enforced via disabled state
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('Next button is disabled at last index (clamps to last)', () => {
    const onHighlightChange = vi.fn();
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={mockLog.length - 1}
        onHighlightChange={onHighlightChange}
      />
    );
    // Next is disabled at last index — boundary is enforced via disabled state
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('position indicator shows correct current/total', () => {
    render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={2}
        onHighlightChange={vi.fn()}
      />
    );
    // highlightIndex=2 → display "3 / 5" (1-indexed)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlighted entry has ring-primary class that non-highlighted entries do not', () => {
    const { container } = render(
      <TacticalLogView
        log={mockLog}
        visibleCount={mockLog.length}
        showStepControls
        highlightIndex={1}
        onHighlightChange={vi.fn()}
      />
    );
    // All log entries are divs with border-l-2 class
    const entries = container.querySelectorAll('.border-l-2');
    expect(entries.length).toBe(mockLog.length);
    // The highlighted one (index 1) should have ring-primary in its class
    const highlighted = entries[1];
    expect(highlighted).toBeDefined();
    expect(highlighted!.className).toMatch(/ring-primary/);
    // Non-highlighted entries should NOT have ring-primary
    const nonHighlighted = entries[0];
    expect(nonHighlighted).toBeDefined();
    expect(nonHighlighted!.className).not.toMatch(/ring-primary/);
  });
});
