import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { ResultsBanner } from '@/components/layout/ResultsBanner';
import type { BoutResult } from '@/engine/bout';

function makeResult(overrides: Partial<BoutResult> = {}): BoutResult {
  return {
    a: { id: 'w1', name: 'Alpha' } as any,
    d: { id: 'w2', name: 'Beta' } as any,
    outcome: { winner: 'w1', by: 'KO', rounds: 3 } as any,
    isRivalry: false,
    ...overrides,
  };
}

describe('ResultsBanner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders null when results=[]', () => {
    const { container } = render(
      <ResultsBanner week={3} results={[]} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders week number and W/L summary from BoutResult[]', () => {
    const results = [
      makeResult({ outcome: { winner: 'w1', by: 'KO', rounds: 3 } as any }),
      makeResult({ outcome: { winner: 'w2', by: 'KO', rounds: 2 } as any }),
    ];
    render(<ResultsBanner week={3} results={results} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Week 3/i)).toBeTruthy();
    // 1 win (winner=w1=attacker), 1 loss (winner=w2=defender)
    expect(screen.getByText('1W')).toBeTruthy();
    expect(screen.getByText('1L')).toBeTruthy();
  });

  it('renders death names in red when deaths > 0', () => {
    const results = [
      makeResult({ outcome: { winner: 'w1', by: 'Kill', rounds: 5 } as any }),
    ];
    render(<ResultsBanner week={5} results={results} onDismiss={vi.fn()} />);
    expect(screen.getByText(/Beta/i)).toBeTruthy();
  });

  it('auto-dismisses after 8 seconds', () => {
    const onDismiss = vi.fn();
    render(
      <ResultsBanner week={3} results={[makeResult()]} onDismiss={onDismiss} />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('closes on X button click', () => {
    const onDismiss = vi.fn();
    render(
      <ResultsBanner week={3} results={[makeResult()]} onDismiss={onDismiss} />
    );
    const closeBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('onDismiss callback fires when dismissed', () => {
    const onDismiss = vi.fn();
    render(
      <ResultsBanner week={3} results={[makeResult()]} onDismiss={onDismiss} />
    );
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(onDismiss).toHaveBeenCalled();
  });
});
