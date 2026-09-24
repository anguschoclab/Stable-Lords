// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import { WarriorTrainingCard } from '@/components/warrior/WarriorTrainingCard';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { WarriorTrainingAdvice } from '@/engine/advisor/types';

vi.mock('@/engine/training', () => ({
  computeGainChance: vi.fn(() => 50),
}));

vi.mock('@/engine/potential', () => ({
  canGrow: vi.fn(() => true),
}));

vi.mock('@/engine/training/trainingGains/traitTraining', () => ({
  traitTrainingPool: vi.fn(() => []),
  canAcquireTrait: vi.fn(() => false),
  TRAIT_CAP: 3,
}));

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: 'w1' as WarriorId,
    name: 'Spartacus',
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    injuries: [],
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 7,
    popularity: 3,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    age: 24,
    fatigue: 0,
    potential: { ST: 20, CN: 20, SZ: 10, WT: 20, WL: 20, SP: 20, DF: 20 },
    potentialRevealed: { ST: true, CN: true, SZ: true, WT: true, WL: true, SP: true, DF: true },
    traits: [],
    ...overrides,
  } as Warrior;
}

const defaultProps = {
  assignment: undefined,
  seasonalGains: {},
  trainers: [],
  onAssign: vi.fn(),
  onAssignRecovery: vi.fn(),
  onClear: vi.fn(),
};

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
