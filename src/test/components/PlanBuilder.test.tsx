// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import PlanBuilder from '@/components/PlanBuilder';
import { FightingStyle } from '@/types/shared.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import '@/test/_setup/setup';

// No longer uses DnD

describe('PlanBuilder Matchup Rendering', () => {
  const mockPlan = {
    style: FightingStyle.AimedBlow,
    OE: 5,
    AL: 5,
    target: 'Any' as any,
    offensiveTactic: 'none' as any,
    defensiveTactic: 'none' as any,
  };

  it('renders MATCHUP_ADV when player has a style advantage', () => {
    // Aimed Blow has +1 advantage vs Bashing Attack
    render(
      <TooltipProvider>
        <PlanBuilder
          plan={mockPlan}
          onPlanChange={vi.fn()}
          rivalStyle={FightingStyle.BashingAttack}
        />
      </TooltipProvider>
    );

    expect(screen.getByText('MATCHUP ADV')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renders MATCHUP_PENALTY when player has a style disadvantage', () => {
    // Bashing Attack is weak to Aimed Blow (-1 penalty)
    const weakPlan = { ...mockPlan, style: FightingStyle.BashingAttack };
    render(
      <TooltipProvider>
        <PlanBuilder plan={weakPlan} onPlanChange={vi.fn()} rivalStyle={FightingStyle.AimedBlow} />
      </TooltipProvider>
    );

    expect(screen.getByText('MATCHUP PENALTY')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('renders no badge when matchup is neutral', () => {
    render(
      <PlanBuilder plan={mockPlan} onPlanChange={vi.fn()} rivalStyle={FightingStyle.AimedBlow} />
    );

    expect(screen.queryByText('MATCHUP ADV')).not.toBeInTheDocument();
    expect(screen.queryByText('MATCHUP PENALTY')).not.toBeInTheDocument();
  });
});

describe('PlanBuilder Bias Presets', () => {
  const mockPlan = {
    style: FightingStyle.AimedBlow,
    OE: 5,
    AL: 5,
    killDesire: 5,
    target: 'Any' as any,
    offensiveTactic: 'none' as any,
    defensiveTactic: 'none' as any,
  };

  it('renders bias preset buttons', () => {
    render(
      <TooltipProvider>
        <PlanBuilder plan={mockPlan} onPlanChange={vi.fn()} />
      </TooltipProvider>
    );

    expect(screen.getByText('HEAD-HUNT')).toBeInTheDocument();
    expect(screen.getByText('HAMSTRING')).toBeInTheDocument();
    expect(screen.getByText('GUT')).toBeInTheDocument();
    expect(screen.getByText('GUARD-BREAK')).toBeInTheDocument();
    expect(screen.getByText('BALANCED')).toBeInTheDocument();
  });

  it('calls onPlanChange with head target when head-hunt preset clicked', () => {
    const onPlanChange = vi.fn();
    render(
      <TooltipProvider>
        <PlanBuilder plan={mockPlan} onPlanChange={onPlanChange} />
      </TooltipProvider>
    );

    screen.getByText('HEAD-HUNT').click();
    expect(onPlanChange).toHaveBeenCalledTimes(1);
    const updated = onPlanChange.mock.calls[0]![0];
    expect(updated.target).toBe('Head');
    expect(updated.killDesire).toBeGreaterThanOrEqual(7);
  });

  it('calls onPlanChange with Any target when balanced preset clicked', () => {
    const onPlanChange = vi.fn();
    render(
      <TooltipProvider>
        <PlanBuilder plan={mockPlan} onPlanChange={onPlanChange} />
      </TooltipProvider>
    );

    screen.getByText('BALANCED').click();
    expect(onPlanChange).toHaveBeenCalledTimes(1);
    const updated = onPlanChange.mock.calls[0]![0];
    expect(updated.target).toBe('Any');
  });

  it('does not render fake Simulation Accuracy metric', () => {
    render(
      <TooltipProvider>
        <PlanBuilder plan={mockPlan} onPlanChange={vi.fn()} />
      </TooltipProvider>
    );

    expect(screen.queryByText(/Simulation Accuracy/)).not.toBeInTheDocument();
  });
});
