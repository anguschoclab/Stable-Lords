// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanBuilder from '@/components/PlanBuilder';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/game';
import { TooltipProvider } from '@/components/ui/tooltip';
import { makeWarrior } from '@/test/_fixtures/factories';

describe('PlanBuilder Council Tactics (Task 4.4)', () => {
  const basePlan: FightPlan = {
    style: FightingStyle.StrikingAttack,
    OE: 5,
    AL: 5,
    target: 'Any',
    offensiveTactic: 'none',
    defensiveTactic: 'none',
  };

  it('renders "Apply Council Tactics" button when warrior is provided', () => {
    const warrior = makeWarrior({ style: FightingStyle.StrikingAttack });

    render(
      <TooltipProvider>
        <PlanBuilder
          plan={basePlan}
          onPlanChange={vi.fn()}
          warrior={warrior}
          rivalStyle={FightingStyle.TotalParry}
        />
      </TooltipProvider>
    );

    const btn = screen.getByTestId('apply-council-tactics-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/Apply Council Tactics/i);
  });

  it('does not render "Apply Council Tactics" button when warrior is undefined', () => {
    render(
      <TooltipProvider>
        <PlanBuilder
          plan={basePlan}
          onPlanChange={vi.fn()}
          warrior={undefined}
        />
      </TooltipProvider>
    );

    expect(screen.queryByTestId('apply-council-tactics-btn')).not.toBeInTheDocument();
  });

  it('calls onPlanChange with council recommended tactics and distance when clicked', () => {
    const warrior = makeWarrior({ style: FightingStyle.StrikingAttack });
    const onPlanChange = vi.fn();

    render(
      <TooltipProvider>
        <PlanBuilder
          plan={basePlan}
          onPlanChange={onPlanChange}
          warrior={warrior}
          rivalStyle={FightingStyle.WallOfSteel}
        />
      </TooltipProvider>
    );

    const btn = screen.getByTestId('apply-council-tactics-btn');
    fireEvent.click(btn);

    expect(onPlanChange).toHaveBeenCalledTimes(1);
    const updatedPlan = onPlanChange.mock.calls[0]![0] as FightPlan;
    // Striking Attack recommended offensive tactic is typically 'charge' or 'slash'/'lunge'
    expect(updatedPlan.offensiveTactic).not.toBe('none');
    expect(updatedPlan.defensiveTactic).not.toBe('none');
  });
});
