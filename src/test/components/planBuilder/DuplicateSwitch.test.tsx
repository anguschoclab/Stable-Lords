import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContingencyPlans from '@/components/planBuilder/ContingencyPlans';
import StylePassives from '@/components/planBuilder/StylePassives';
import type { FightPlan, Warrior } from '@/types/game';

const mockPlan: FightPlan = {
  style: 'LungingAttack',
  tempo: 'balanced',
  conditions: [],
} as unknown as FightPlan;

const mockWarrior = {} as unknown as Warrior;

describe('Duplicate Switch bug fix', () => {
  it('ContingencyPlans renders exactly one Switch', () => {
    render(<ContingencyPlans plan={mockPlan} onPlanChange={() => {}} />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(1);
  });

  it('ContingencyPlans Switch has aria-label', () => {
    render(<ContingencyPlans plan={mockPlan} onPlanChange={() => {}} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-label', 'Contingency Plans');
  });

  it('StylePassives renders exactly one Switch', () => {
    render(<StylePassives plan={mockPlan} warrior={mockWarrior} />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(1);
  });

  it('StylePassives Switch has aria-label', () => {
    render(<StylePassives plan={mockPlan} warrior={mockWarrior} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-label', 'Style Passives');
  });
});
