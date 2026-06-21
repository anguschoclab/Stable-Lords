// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FirstBloodStep from '@/components/orphanage/FirstBloodStep';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { Warrior, FightOutcome, FightSummary } from '@/types/game';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';

// jsdom doesn't implement scrollIntoView
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const warriorA: Warrior = makeWarrior('w1' as any, 'Aulus', FightingStyle.LungingAttack, {
  ST: 12,
  CN: 10,
  SZ: 8,
  WT: 14,
  WL: 12,
  SP: 15,
  DF: 11,
});

const warriorD: Warrior = makeWarrior('w2' as any, 'Bran', FightingStyle.TotalParry, {
  ST: 10,
  CN: 14,
  SZ: 12,
  WT: 10,
  WL: 16,
  SP: 8,
  DF: 14,
});

const mockOutcome: FightOutcome = {
  winner: 'A',
  by: 'Kill',
  minutes: 5,
  log: [
    { minute: 1, text: 'Aulus strikes Bran' },
    { minute: 2, text: 'Bran parries' },
    { minute: 3, text: 'Aulus lands a devastating blow' },
    { minute: 4, text: 'Bran is slain' },
    { minute: 5, text: 'Aulus victorious' },
  ],
};

const mockSummary: FightSummary = {
  id: 'ftue-1' as any,
  week: 1,
  title: 'First Blood',
  warriorIdA: 'w1' as any,
  warriorIdD: 'w2' as any,
  winner: 'A',
  by: 'Kill',
  styleA: 'LUNGING ATTACK',
  styleD: 'TOTAL PARRY',
  createdAt: '2026-01-01',
} as any;

const mockBoutResult = {
  a: warriorA,
  d: warriorD,
  outcome: mockOutcome,
  summary: mockSummary,
};

describe('FirstBloodStep', () => {
  it('renders both fighter names', () => {
    render(<FirstBloodStep boutResult={mockBoutResult} onBack={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText('Aulus')).toBeInTheDocument();
    expect(screen.getByText('Bran')).toBeInTheDocument();
  });

  it('renders TacticalLogView with step controls (Prev and Next buttons)', () => {
    render(<FirstBloodStep boutResult={mockBoutResult} onBack={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('renders winner banner with winner name', () => {
    render(<FirstBloodStep boutResult={mockBoutResult} onBack={vi.fn()} onNext={vi.fn()} />);
    // "Aulus" appears in both fighter name and winner banner — use getAllByText
    const aulusMatches = screen.getAllByText(/Aulus/);
    expect(aulusMatches.length).toBeGreaterThanOrEqual(2);
    // "victorious" appears in both the log entry and the winner banner
    const victoriousMatches = screen.getAllByText(/victorious/i);
    expect(victoriousMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Back and Continue navigation buttons', () => {
    render(<FirstBloodStep boutResult={mockBoutResult} onBack={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('clicking Next step button updates position indicator from 1/5 to 2/5', () => {
    render(<FirstBloodStep boutResult={mockBoutResult} onBack={vi.fn()} onNext={vi.fn()} />);
    // Initial position should show "1 / 5"
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Click the Next step control (not the Continue button)
    const nextBtn = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextBtn);

    // Position should now show "2 / 5"
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('clicking Prev step button at index 0 keeps position at 1/5', () => {
    render(<FirstBloodStep boutResult={mockBoutResult} onBack={vi.fn()} onNext={vi.fn()} />);
    // Prev is disabled at index 0, position stays "1 / 5"
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
