// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

vi.mock('@/components/charts/WarriorRadarChart', () => ({
  WarriorRadarChart: ({ warrior }: any) => (
    <div data-testid="radar-chart" data-warrior={warrior.id} />
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('@/components/warrior/dossier/WarriorDossierHeader', () => ({
  WarriorDossierHeader: () => <div data-testid="dossier-header" />,
}));
vi.mock('@/components/warrior/dossier/WarriorDossierTraits', () => ({
  WarriorDossierTraits: () => <div data-testid="dossier-traits" />,
}));
vi.mock('@/components/warrior/dossier/WarriorDossierStats', () => ({
  default: () => <div data-testid="dossier-stats" />,
}));
vi.mock('@/components/warrior/dossier/WarriorDossierTabs', () => ({
  default: () => <div data-testid="dossier-tabs" />,
}));
vi.mock('@/components/warrior/dossier/WarriorDossierSoulBond', () => ({
  default: () => <div data-testid="dossier-soul-bond" />,
}));
vi.mock('@/components/warrior/dossier/WarriorDossierMedicalReport', () => ({
  WarriorDossierMedicalReport: () => <div data-testid="dossier-medical" />,
}));

vi.mock('@/state/useGameStore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  useWorldState: vi.fn(() => mockState),
};
});

vi.mock('@/engine/core/historyResolver', () => ({
  findWarrior: vi.fn((_state: any, warriorId: string) =>
    mockState.roster.find((w: any) => w.id === warriorId) ?? null
  ),
}));

const mockState: any = { roster: [] as Warrior[] };

function makeWarrior(overrides: Partial<Warrior> = {}): Warrior {
  return {
    id: (overrides.id ?? 'w1') as WarriorId,
    name: overrides.name ?? 'Spartacus',
    style: 'StrikingAttack' as FightingStyle,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
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

import { WarriorDossier } from '@/components/WarriorDossier';

describe('WarriorDossier', () => {
  beforeEach(() => {
    mockState.roster = [makeWarrior()];
  });

  it('renders "Warrior not found." for unknown warriorId', () => {
    render(<WarriorDossier warriorId={'nonexistent' as WarriorId} />);
    expect(screen.getByText('Warrior not found.')).toBeInTheDocument();
  });

  it('renders "Physical Polygon" card header', () => {
    render(<WarriorDossier warriorId={'w1' as WarriorId} />);
    expect(screen.getByText('Physical Polygon')).toBeInTheDocument();
  });

  it('renders WarriorRadarChart inside Suspense', () => {
    render(<WarriorDossier warriorId={'w1' as WarriorId} />);
    expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
  });

  it('passes the correct warrior to WarriorRadarChart', () => {
    render(<WarriorDossier warriorId={'w1' as WarriorId} />);
    const chart = screen.getByTestId('radar-chart');
    expect(chart.getAttribute('data-warrior')).toBe('w1');
  });

  it('renders dossier sub-components', () => {
    render(<WarriorDossier warriorId={'w1' as WarriorId} />);
    expect(screen.getByTestId('dossier-header')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-traits')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-stats')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-soul-bond')).toBeInTheDocument();
    expect(screen.getByTestId('dossier-medical')).toBeInTheDocument();
  });
});
