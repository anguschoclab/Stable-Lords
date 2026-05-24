// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import PlanBuilder from '@/components/PlanBuilder';
import { FightingStyle } from '@/types/shared.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import '@/test/setup';

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
