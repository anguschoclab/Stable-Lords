// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WarriorTrainingCard } from '@/components/warrior/WarriorTrainingCard';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { WarriorTrainingAdvice } from '@/engine/advisor/types';
import { makeTrainingWarrior, makeTrainingCardProps } from '@/test/_fixtures/trainingCard';

vi.mock('@/engine/training', () => ({
  computeGainChance: vi.fn(() => 50),
}));

vi.mock('@/engine/warrior/potential', () => ({
  canGrow: vi.fn(() => true),
}));

vi.mock('@/engine/training/trainingGains/traitTraining', () => ({
  traitTrainingPool: vi.fn(() => []),
  canAcquireTrait: vi.fn(() => false),
  TRAIT_CAP: 3,
}));

const makeWarrior = makeTrainingWarrior;

const defaultProps = makeTrainingCardProps();

describe('WarriorTrainingCard Council Suggestions (Task 4.3)', () => {
  it('renders Council Pick badge on recommended attribute row', () => {
    const warrior = makeWarrior();
    const advisorAdvice: WarriorTrainingAdvice = {
      mode: 'attribute',
      targetAttribute: 'ST',
      headline: 'Strength Training',
      reasoning: 'Prime synergy with Striking Attack',
      gainChance: 65,
    };

    render(
      <TooltipProvider>
        <WarriorTrainingCard warrior={warrior} {...defaultProps} advisorAdvice={advisorAdvice} />
      </TooltipProvider>
    );

    const badge = screen.getByTestId('advisor-attribute-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/Council Pick/i);
  });

  it('renders Council Pick badge on recovery button when Med Bay recovery is recommended', () => {
    const warrior = makeWarrior({
      injuries: [{ name: 'Fractured Ribs', severity: 'Moderate', weeksRemaining: 2 } as any],
    });
    const advisorAdvice: WarriorTrainingAdvice = {
      mode: 'recovery',
      headline: 'Active Recovery',
      reasoning: 'Warrior is carrying injuries and must enter recovery',
    };

    render(
      <TooltipProvider>
        <WarriorTrainingCard warrior={warrior} {...defaultProps} advisorAdvice={advisorAdvice} />
      </TooltipProvider>
    );

    const badge = screen.getByTestId('advisor-recovery-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent(/Council Pick/i);
  });

  it('does not render badges when no advisorAdvice is provided', () => {
    const warrior = makeWarrior();

    render(
      <TooltipProvider>
        <WarriorTrainingCard warrior={warrior} {...defaultProps} />
      </TooltipProvider>
    );

    expect(screen.queryByTestId('advisor-attribute-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('advisor-recovery-badge')).not.toBeInTheDocument();
  });
});
