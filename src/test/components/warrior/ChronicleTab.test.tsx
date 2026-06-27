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
vi.mock('@/components/warrior/CareerTimeline', () => ({
  CareerTimeline: () => <div data-testid="career-timeline" />,
}));
vi.mock('@/components/warrior/WarriorFightHistory', () => ({
  WarriorFightHistory: () => <div data-testid="fight-history" />,
}));

import { ChronicleTab } from '@/components/warrior/ChronicleTab';

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

describe('ChronicleTab', () => {
  const warrior = makeWarrior();

  it('renders "Path of Blood" SectionDivider', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Path of Blood')).toBe(true);
  });

  it('renders "Annals" SectionDivider', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Annals')).toBe(true);
  });

  it('renders "Chronicle of Merit" card header', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    expect(screen.getByText('Chronicle of Merit')).toBeInTheDocument();
  });

  it('renders "Highest Renown" stat label', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    expect(screen.getByText('Highest Renown')).toBeInTheDocument();
  });

  it('renders "Laurels Won" stat label', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    expect(screen.getByText('Laurels Won')).toBeInTheDocument();
  });

  it('renders "Purse Earned" stat label', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    expect(screen.getByText('Purse Earned')).toBeInTheDocument();
  });

  it('renders "Honors" SectionDivider when warrior has awards', () => {
    const warriorWithAwards = makeWarrior({
      awards: [{ year: 1, type: 'WARRIOR_OF_YEAR' as any, reason: 'Dominant', value: 10 }],
    } as any);
    render(<ChronicleTab warrior={warriorWithAwards} arenaHistory={[]} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Honors')).toBe(true);
  });

  it('does not render "Honors" SectionDivider when warrior has no awards', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Honors')).toBe(false);
  });

  it('renders "Arena Record" SectionDivider', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    const dividers = screen.getAllByTestId('section-divider');
    expect(dividers.some((d) => d.textContent === 'Arena Record')).toBe(true);
  });

  it('renders "Blood Record" h2', () => {
    render(<ChronicleTab warrior={warrior} arenaHistory={[]} />);
    expect(screen.getByText('Blood Record')).toBeInTheDocument();
  });
});
