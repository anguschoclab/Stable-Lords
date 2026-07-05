// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock('@/engine/core/historyUtils', () => ({
  getAllFightsForWarrior: vi.fn((_history: any, _id: any) => mockFights),
}));

import { getAllFightsForWarrior } from '@/engine/core/historyUtils';

let mockFights: any[] = [];

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

import { CareerTimeline } from '@/components/warrior/CareerTimeline';

describe('CareerTimeline', () => {
  beforeEach(() => {
    mockFights = [];
    vi.mocked(getAllFightsForWarrior).mockImplementation(() => mockFights);
  });

  it('renders nothing when no milestones', () => {
    const { container } = render(<CareerTimeline warrior={makeWarrior()} arenaHistory={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Saga" card title when milestones exist', () => {
    mockFights = [
      {
        id: 'f1',
        week: 1,
        warriorIdA: 'w1',
        warriorIdD: 'w2',
        winner: 'A',
        by: 'KO',
        title: 'Spartacus vs Other',
      },
    ];
    render(<CareerTimeline warrior={makeWarrior()} arenaHistory={[]} />);
    expect(screen.getByText('Saga')).toBeInTheDocument();
  });

  it('renders "First Blood" milestone for first fight', () => {
    mockFights = [
      {
        id: 'f1',
        week: 1,
        warriorIdA: 'w1',
        warriorIdD: 'w2',
        winner: 'A',
        by: 'KO',
        title: 'Spartacus vs Other',
      },
    ];
    render(<CareerTimeline warrior={makeWarrior()} arenaHistory={[]} />);
    expect(screen.getByText('First Blood')).toBeInTheDocument();
  });

  it('renders "First Triumph" milestone for first win', () => {
    mockFights = [
      {
        id: 'f1',
        week: 1,
        warriorIdA: 'w1',
        warriorIdD: 'w2',
        winner: 'A',
        by: 'KO',
        title: 'Spartacus vs Other',
      },
    ];
    render(<CareerTimeline warrior={makeWarrior()} arenaHistory={[]} />);
    expect(screen.getByText('First Triumph')).toBeInTheDocument();
  });

  it('renders "Granted Rudis" milestone when warrior status is Retired', () => {
    mockFights = [
      {
        id: 'f1',
        week: 1,
        warriorIdA: 'w1',
        warriorIdD: 'w2',
        winner: 'A',
        by: 'KO',
        title: 'Spartacus vs Other',
      },
    ];
    const retired = makeWarrior({ status: 'Retired', retiredWeek: 5 } as any);
    render(<CareerTimeline warrior={retired} arenaHistory={[]} />);
    expect(screen.getByText('Granted Rudis')).toBeInTheDocument();
  });
});
