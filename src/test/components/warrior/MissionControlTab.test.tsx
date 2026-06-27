// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/SectionDivider', () => ({
  SectionDivider: ({ label }: any) => <div data-testid="section-divider">{label}</div>,
}));
vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/PlanBuilder', () => ({
  default: () => <div data-testid="plan-builder" />,
}));
vi.mock('@/components/EquipmentLoadout', () => ({
  default: () => <div data-testid="equipment-loadout" />,
}));
vi.mock('@/components/widgets', () => ({
  SchedulingWidget: () => <div data-testid="scheduling-widget" />,
}));

import { MissionControlTab } from '@/components/warrior/MissionControlTab';

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: (overrides.id ?? 'w1') as WarriorId,
    name: 'Spartacus',
    style: 'StrikingAttack' as FightingStyle,
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
    ...overrides,
  } as Warrior;
}

describe('MissionControlTab', () => {
  const baseProps = {
    warrior: makeWarrior(),
    currentPlan: {} as any,
    currentLoadout: {} as any,
    onPlanChange: vi.fn(),
    onEquipmentChange: vi.fn(),
  };

  it('renders "Pre-Fight Orders" SectionDivider', () => {
    render(<MissionControlTab {...baseProps} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Pre-Fight Orders')).toBe(true);
  });

  it('renders "Battle Doctrine" card header', () => {
    render(<MissionControlTab {...baseProps} />);
    expect(screen.getByText('Battle Doctrine')).toBeInTheDocument();
  });

  it('renders "Custom Mandate" badge', () => {
    render(<MissionControlTab {...baseProps} />);
    expect(screen.getByText('Custom Mandate')).toBeInTheDocument();
  });

  it('renders "Arming" SectionDivider', () => {
    render(<MissionControlTab {...baseProps} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Arming')).toBe(true);
  });

  it('renders "Issued Arms" card header', () => {
    render(<MissionControlTab {...baseProps} />);
    expect(screen.getByText('Issued Arms')).toBeInTheDocument();
  });

  it('renders "Intelligence" SectionDivider', () => {
    render(<MissionControlTab {...baseProps} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Intelligence')).toBe(true);
  });

  it('renders "Dispatches" card header', () => {
    render(<MissionControlTab {...baseProps} />);
    expect(screen.getByText('Dispatches')).toBeInTheDocument();
  });
});
