// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';
import type { ObfuscatedWarrior } from '@/lib/obfuscation';

vi.mock('@/components/charts/WarriorRadarChart', () => ({
  WarriorRadarChart: ({ warrior }: any) => (
    <div data-testid="radar-chart" data-warrior={warrior.id} />
  ),
}));

vi.mock('@/components/charts/FormSparkline', () => ({
  FormSparkline: ({ warriorId }: any) => (
    <div data-testid="form-sparkline" data-warrior={warriorId} />
  ),
}));

vi.mock('@/components/warrior/FavoritesCard', () => ({
  FavoritesCard: () => <div data-testid="favorites-card" />,
}));

vi.mock('@/components/warrior/WarriorStats', () => ({
  AttrBar: ({ label }: any) => <div data-testid="attr-bar">{label}</div>,
  SkillBar: ({ label }: any) => <div data-testid="skill-bar">{label}</div>,
  WarriorStatementsPanel: () => <div data-testid="statements-panel" />,
}));

vi.mock('@/components/warrior/GrowthHelpers', () => ({
  overallGrowthNarrative: () => 'Growth narrative text',
}));

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/SectionDivider', () => ({
  SectionDivider: ({ label }: any) => <div data-testid="section-divider">{label}</div>,
}));

vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

import { BiometricsTab } from '@/components/warrior/BiometricsTab';

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: (overrides.id ?? 'w1') as WarriorId,
    name: overrides.name ?? 'Spartacus',
    style: 'StrikingAttack' as FightingStyle,
    attributes: { ST: 10, CN: 12, SZ: 8, WT: 15, WL: 14, SP: 11, DF: 9 },
    baseSkills: { ATT: 10, DEF: 10, INI: 10, PAR: 10, RIP: 10, DEC: 10 },
    derivedStats: { hp: 100, endurance: 100, damage: 5, encumbrance: 0 },
    injuries: [],
    career: { wins: 5, losses: 3, kills: 1 },
    fame: 0,
    popularity: 0,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    ...overrides,
  } as Warrior;
}

function makeDisplayWarrior(warrior: Warrior): ObfuscatedWarrior {
  return {
    ...warrior,
    isFullyRevealed: true,
    equipment: warrior.equipment || 'HIDDEN',
  } as ObfuscatedWarrior;
}

describe('BiometricsTab', () => {
  const warrior = makeWarrior();
  const displayWarrior = makeDisplayWarrior(warrior);

  it('renders WarriorRadarChart inside Suspense with correct warrior', async () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(await screen.findByTestId('radar-chart')).toBeInTheDocument();
  });

  it('renders WarriorRadarChart inside Suspense', async () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(await screen.findByTestId('radar-chart')).toBeInTheDocument();
  });

  it('passes the correct warrior to WarriorRadarChart', async () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    const chart = await screen.findByTestId('radar-chart');
    expect(chart.getAttribute('data-warrior')).toBe('w1');
  });

  it('renders all 5 primary attribute bars', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    const bars = screen.getAllByTestId('attr-bar');
    expect(bars).toHaveLength(5);
    expect(bars[0]?.textContent).toBe('Strength');
    expect(bars[1]?.textContent).toBe('Constitution');
    expect(bars[2]?.textContent).toBe('Deftness');
    expect(bars[3]?.textContent).toBe('Speed');
    expect(bars[4]?.textContent).toBe('Size');
  });

  it('renders FormSparkline with correct warrior', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    const sparkline = screen.getByTestId('form-sparkline');
    expect(sparkline.getAttribute('data-warrior')).toBe('w1');
  });

  it('renders FormSparkline', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByTestId('form-sparkline')).toBeInTheDocument();
  });

  it('renders "Combat Affinities" section divider (replaces "Preferences")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Combat Affinities')).toBeInTheDocument();
  });

  it('renders "Physique" section divider (replaces "Physical Profile")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Physique')).toBeInTheDocument();
  });

  it('renders "Arena Form" label (replaces "Historical Form")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Arena Form')).toBeInTheDocument();
  });

  it('renders "Combat Vitals" section divider (replaces "Performance")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Combat Vitals')).toBeInTheDocument();
  });

  it('renders "Body" card header (replaces "Primary Vitals")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders "Assessments" card header (replaces "Observations")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Assessments')).toBeInTheDocument();
  });

  it('renders "Trained Arts" section divider (replaces "Specialized Disciplines")', () => {
    render(<BiometricsTab warrior={warrior} displayWarrior={displayWarrior} />);
    expect(screen.getByText('Trained Arts')).toBeInTheDocument();
  });
});
