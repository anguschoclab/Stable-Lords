// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorId } from '@/types/shared.types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TrainingCardHeader } from '@/components/warrior/TrainingCardHeader';

vi.mock('@/components/ui/WarriorBadges', () => ({
  WarriorNameTag: ({ name }: { name: string }) => <span data-testid="warrior-name">{name}</span>,
  StatBadge: () => <span data-testid="stat-badge" />,
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
    ...overrides,
  } as Warrior;
}

function renderHeader(warrior = makeWarrior(), total = 70, hasInjury = false) {
  return render(
    <TooltipProvider>
      <TrainingCardHeader warrior={warrior} total={total} hasInjury={hasInjury} />
    </TooltipProvider>
  );
}

describe('TrainingCardHeader', () => {
  it('renders warrior name via WarriorNameTag', () => {
    const { getByTestId } = renderHeader();
    expect(getByTestId('warrior-name')).toHaveTextContent('Spartacus');
  });

  it('renders style display name', () => {
    const { container } = renderHeader();
    expect(container.textContent).toContain('Striker');
  });

  it('renders age', () => {
    const { container } = renderHeader(makeWarrior({ age: 28 }));
    expect(container.textContent).toContain('28');
  });

  it('renders injury badge when hasInjury is true', () => {
    const { container } = renderHeader(makeWarrior({ injuries: [{ id: 'i1' as any, name: 'Bruised', description: 'Ouch', severity: 'Moderate', location: 'Right Arm', weeksRemaining: 1, penalties: {} }] }), 70, true);
    expect(container.textContent).toContain('INJURED');
  });

  it('does not render injury badge when hasInjury is false', () => {
    const { container } = renderHeader(makeWarrior(), 70, false);
    expect(container.textContent).not.toContain('Injured');
  });

  it('renders sum tooltip with correct total', () => {
    const { container } = renderHeader(makeWarrior(), 77);
    expect(container.textContent).toContain('77');
  });
});
