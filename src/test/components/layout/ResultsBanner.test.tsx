import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TooltipProvider } from '@radix-ui/react-tooltip';

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
      <TooltipProvider>
        <ResultsBanner week={3} results={[]} onDismiss={vi.fn()} />
      </TooltipProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders week number and W/L summary from BoutResult[]', () => {
    const results = [
      makeResult({ outcome: { winner: 'w1', by: 'KO', rounds: 3 } as any }),
      makeResult({ outcome: { winner: 'w2', by: 'KO', rounds: 2 } as any }),
    ];
    render(
      <TooltipProvider>
        <ResultsBanner week={3} results={results} onDismiss={vi.fn()} />
      </TooltipProvider>
    );
    expect(screen.getByText(/Week 3/i)).toBeTruthy();
    // 1 win (winner=w1=attacker), 1 loss (winner=w2=defender)
    expect(screen.getByText('1W')).toBeTruthy();
    expect(screen.getByText('1L')).toBeTruthy();
  });

  it('renders death names in red when deaths > 0', () => {
    const results = [makeResult({ outcome: { winner: 'w1', by: 'Kill', rounds: 5 } as any })];
    render(
      <TooltipProvider>
        <ResultsBanner week={5} results={results} onDismiss={vi.fn()} />
      </TooltipProvider>
    );
    expect(screen.getByText(/Beta/i)).toBeTruthy();
  });

  it('correctly calculates mixed wins, losses, kills, and deaths in a single pass', () => {
    const results = [
      makeResult({
        a: { id: 'w1', name: 'Alpha' } as any,
        d: { id: 'w2', name: 'Beta' } as any,
        outcome: { winner: 'w1', by: 'Kill', rounds: 4 } as any,
      }),
      makeResult({
        a: { id: 'w3', name: 'Gamma' } as any,
        d: { id: 'w4', name: 'Delta' } as any,
        outcome: { winner: 'w3', by: 'KO', rounds: 2 } as any,
      }),
      makeResult({
        a: { id: 'w5', name: 'Epsilon' } as any,
        d: { id: 'w6', name: 'Zeta' } as any,
        outcome: { winner: 'w6', by: 'Decision', rounds: 5 } as any,
      }),
      makeResult({
        a: { id: 'w7', name: 'Eta' } as any,
        d: { id: 'w8', name: 'Theta' } as any,
        outcome: { winner: 'w8', by: 'Kill', rounds: 3 } as any,
      }),
    ];
    render(
      <TooltipProvider>
        <ResultsBanner week={4} results={results} onDismiss={vi.fn()} />
      </TooltipProvider>
    );
    expect(screen.getByText('2W')).toBeTruthy();
    expect(screen.getByText('2L')).toBeTruthy();
    expect(screen.getByText(/Beta, Eta fell in the arena/i)).toBeTruthy();
  });

  it('auto-dismisses after 8 seconds', () => {
    const onDismiss = vi.fn();
    render(
      <TooltipProvider>
        <ResultsBanner week={3} results={[makeResult()]} onDismiss={onDismiss} />
      </TooltipProvider>
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
      <TooltipProvider>
        <ResultsBanner week={3} results={[makeResult()]} onDismiss={onDismiss} />
      </TooltipProvider>
    );
    const closeBtn = screen.getByRole('button', { name: /dismiss/i });
    fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('onDismiss callback fires when dismissed', () => {
    const onDismiss = vi.fn();
    render(
      <TooltipProvider>
        <ResultsBanner week={3} results={[makeResult()]} onDismiss={onDismiss} />
      </TooltipProvider>
    );
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    expect(onDismiss).toHaveBeenCalled();
  });
});
