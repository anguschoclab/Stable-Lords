// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { makeSpartacusWarrior } from '@/test/_fixtures/factories';

vi.mock('@/components/ui/Surface', () => ({ ...__SHARED_MOCKS.uiSurface }));
vi.mock('@/components/ui/SectionDivider', () => ({ ...__SHARED_MOCKS.uiSectionDivider }));
vi.mock('@/components/ui/ImperialRing', () => ({ ...__SHARED_MOCKS.uiImperialRing }));
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

const makeWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
  makeSpartacusWarrior({
    ...overrides,
  });

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
