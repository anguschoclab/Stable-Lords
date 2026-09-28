// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import { makeSpartacusWarrior } from '@/test/_fixtures/factories';

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

const makeWarrior = (overrides: Partial<Warrior> = {}): Warrior =>
  makeSpartacusWarrior({
    ...overrides,
  });

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
