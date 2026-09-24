// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanBuilder from '@/components/PlanBuilder';
import { FightingStyle } from '@/types/shared.types';
import type { FightPlan } from '@/types/game';
import { TooltipProvider } from '@/components/ui/tooltip';
import { makeWarrior, makeGameState } from '@/test/_fixtures/factories';
import { useGameStore } from '@/state/useGameStore';
import type { GameState } from '@/types/state.types';

describe('PlanBuilder Council Tactics (Task 4.4)', () => {
  beforeEach(() => {
    const fresh = makeGameState({ week: 1, season: 'Spring' });
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

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

  it('auto-detects REHABILITATION for an unpinned injured warrior and applies YIELD fallback', () => {
    const warrior = makeWarrior({
      style: FightingStyle.StrikingAttack,
      injuries: [
        {
          id: 'inj-1' as any,
          name: 'Fractured Rib',
          description: '',
          severity: 'Moderate',
          weeksRemaining: 2,
          penalties: {},
        },
      ],
    });

    const onPlanChange = vi.fn();
    render(
      <TooltipProvider>
        <PlanBuilder plan={basePlan} onPlanChange={onPlanChange} warrior={warrior} />
      </TooltipProvider>
    );

    fireEvent.click(screen.getByTestId('apply-council-tactics-btn'));

    const updatedPlan = onPlanChange.mock.calls[0]![0] as FightPlan;
    // Auto-detected REHABILITATION focus must surface the life-preserving YIELD
    // fallback — a pinned-less PURSE_HUNTER default would leave TURTLE in place.
    expect(updatedPlan.fallbackCondition).toBe('YIELD');
  });
});
