// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TacticBank, { TACTIC_BANK } from '@/components/planBuilder/TacticBank';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/shared.types';

const mockPlan: FightPlan = {
  style: FightingStyle.AimedBlow,
  OE: 5,
  AL: 5,
  killDesire: 5,
  offensiveTactic: 'none',
  defensiveTactic: 'none',
} as FightPlan;

describe('TACTIC_BANK constant', () => {
  it('has exactly 8 entries', () => {
    expect(TACTIC_BANK).toHaveLength(8);
  });

  it('has exactly 4 offensive entries (Lunge, Slash, Bash, Decisiveness)', () => {
    const offensive = TACTIC_BANK.filter((t) => t.type === 'offensive');
    expect(offensive).toHaveLength(4);
    expect(offensive.map((t) => t.id)).toEqual(['Lunge', 'Slash', 'Bash', 'Decisiveness']);
  });

  it('has exactly 4 defensive entries (Dodge, Parry, Riposte, Responsiveness)', () => {
    const defensive = TACTIC_BANK.filter((t) => t.type === 'defensive');
    expect(defensive).toHaveLength(4);
    expect(defensive.map((t) => t.id)).toEqual(['Dodge', 'Parry', 'Riposte', 'Responsiveness']);
  });

  it('each entry has id, type, label, and icon (icon is a component)', () => {
    TACTIC_BANK.forEach((t) => {
      expect(t.id).toBeDefined();
      expect(t.type).toBeDefined();
      expect(t.label).toBeDefined();
      expect(t.icon).toBeDefined();
      expect(typeof t.icon).toBe('object');
    });
  });

  it('offensive IDs are valid OffensiveTactic values', () => {
    const validOffensive = ['Lunge', 'Slash', 'Bash', 'Decisiveness'];
    TACTIC_BANK.filter((t) => t.type === 'offensive').forEach((t) => {
      expect(validOffensive).toContain(t.id);
    });
  });

  it('defensive IDs are valid DefensiveTactic values', () => {
    const validDefensive = ['Dodge', 'Parry', 'Riposte', 'Responsiveness'];
    TACTIC_BANK.filter((t) => t.type === 'defensive').forEach((t) => {
      expect(validDefensive).toContain(t.id);
    });
  });
});

describe('TacticBank component', () => {
  it('renders "Tactic Bank" header text', () => {
    render(<TacticBank plan={mockPlan} onPlanChange={vi.fn()} />);
    expect(screen.getByText('Tactic Bank')).toBeInTheDocument();
  });

  it('renders all 8 tactic buttons', () => {
    render(<TacticBank plan={mockPlan} onPlanChange={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
  });

  it('each button has correct aria-label="Select Tactic: {id}"', () => {
    render(<TacticBank plan={mockPlan} onPlanChange={vi.fn()} />);
    TACTIC_BANK.forEach((t) => {
      expect(screen.getByLabelText(`Select Tactic: ${t.id}`)).toBeInTheDocument();
    });
  });

  it('each button renders its label text', () => {
    render(<TacticBank plan={mockPlan} onPlanChange={vi.fn()} />);
    TACTIC_BANK.forEach((t) => {
      expect(screen.getByText(t.label)).toBeInTheDocument();
    });
  });

  it('calls onPlanChange with offensiveTactic set when offensive button clicked', () => {
    const onPlanChange = vi.fn();
    render(<TacticBank plan={mockPlan} onPlanChange={onPlanChange} />);
    fireEvent.click(screen.getByLabelText('Select Tactic: Lunge'));
    expect(onPlanChange).toHaveBeenCalledOnce();
    expect(onPlanChange).toHaveBeenCalledWith(
      expect.objectContaining({ offensiveTactic: 'Lunge' })
    );
  });

  it('calls onPlanChange with defensiveTactic set when defensive button clicked', () => {
    const onPlanChange = vi.fn();
    render(<TacticBank plan={mockPlan} onPlanChange={onPlanChange} />);
    fireEvent.click(screen.getByLabelText('Select Tactic: Dodge'));
    expect(onPlanChange).toHaveBeenCalledOnce();
    expect(onPlanChange).toHaveBeenCalledWith(
      expect.objectContaining({ defensiveTactic: 'Dodge' })
    );
  });

  it('spreads existing plan properties (preserves other fields like OE, AL, style)', () => {
    const onPlanChange = vi.fn();
    render(<TacticBank plan={mockPlan} onPlanChange={onPlanChange} />);
    fireEvent.click(screen.getByLabelText('Select Tactic: Lunge'));
    expect(onPlanChange).toHaveBeenCalledWith(
      expect.objectContaining({
        OE: 5,
        AL: 5,
        style: FightingStyle.AimedBlow,
        killDesire: 5,
        offensiveTactic: 'Lunge',
      })
    );
  });

  it('does NOT call onPlanChange when plan is undefined', () => {
    const onPlanChange = vi.fn();
    render(<TacticBank onPlanChange={onPlanChange} />);
    fireEvent.click(screen.getByLabelText('Select Tactic: Lunge'));
    expect(onPlanChange).not.toHaveBeenCalled();
  });

  it('does NOT call onPlanChange when onPlanChange is undefined', () => {
    render(<TacticBank plan={mockPlan} />);
    // Should not throw
    fireEvent.click(screen.getByLabelText('Select Tactic: Lunge'));
  });

  it('applies active styling (bg-arena-blood/20) to selected offensive tactic', () => {
    const plan = { ...mockPlan, offensiveTactic: 'Lunge' as any };
    render(<TacticBank plan={plan} onPlanChange={vi.fn()} />);
    const btn = screen.getByLabelText('Select Tactic: Lunge');
    expect(btn.className).toMatch(/bg-arena-blood\/20/);
  });

  it('applies active styling (bg-arena-blood/20) to selected defensive tactic', () => {
    const plan = { ...mockPlan, defensiveTactic: 'Dodge' as any };
    render(<TacticBank plan={plan} onPlanChange={vi.fn()} />);
    const btn = screen.getByLabelText('Select Tactic: Dodge');
    expect(btn.className).toMatch(/bg-arena-blood\/20/);
  });

  it('does NOT apply active styling to non-selected tactics', () => {
    const plan = { ...mockPlan, offensiveTactic: 'Lunge' as any };
    render(<TacticBank plan={plan} onPlanChange={vi.fn()} />);
    const btn = screen.getByLabelText('Select Tactic: Slash');
    expect(btn.className).not.toMatch(/bg-arena-blood\/20/);
  });

  it('buttons have focus-visible:ring classes for accessibility', () => {
    render(<TacticBank plan={mockPlan} onPlanChange={vi.fn()} />);
    const btn = screen.getByLabelText('Select Tactic: Lunge');
    expect(btn.className).toMatch(/focus-visible:ring/);
  });
});
