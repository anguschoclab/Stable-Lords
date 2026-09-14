import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InducteeCard } from '@/pages/HallOfFame/InducteeCard';
import type { Warrior, FightSummary } from '@/types/game';
import { Trophy } from 'lucide-react';

const mockWarrior: Warrior = {
  id: 'w-inductee-1',
  name: 'Maximus Inductus',
  style: 'LungingAttack',
  career: { wins: 20, losses: 2, kills: 10 },
  attributes: { ST: 14, DX: 12, CN: 10, SZ: 14, WL: 12, SP: 10 },
  traits: [],
  titles: [],
  injuries: [],
  history: [],
} as any;

describe('InducteeCard', () => {
  it('renders inductee name and award title', () => {
    render(
      <InducteeCard
        warrior={mockWarrior}
        title="Warrior of the Year"
        icon={<Trophy data-testid="trophy-icon" />}
        fights={[]}
      />
    );

    expect(screen.getByText('Maximus Inductus')).toBeTruthy();
    expect(screen.getByText('Warrior of the Year')).toBeTruthy();
  });

  it('correctly identifies and displays the best fight by score', () => {
    const fights: FightSummary[] = [
      {
        id: 'f1',
        title: 'Maximus Inductus vs Opponent A',
        warriorIdA: 'w-inductee-1',
        warriorIdD: 'w-opp-1',
        winner: 'w-inductee-1',
        by: 'KO',
        flashyTags: [],
      } as any,
      {
        id: 'f2',
        title: 'Maximus Inductus vs Opponent B',
        warriorIdA: 'w-inductee-1',
        warriorIdD: 'w-opp-2',
        winner: 'w-inductee-1',
        by: 'Kill',
        flashyTags: ['Comeback'],
      } as any,
    ];

    render(
      <InducteeCard
        warrior={mockWarrior}
        title="Warrior of the Year"
        icon={<Trophy />}
        fights={fights}
      />
    );

    expect(screen.getByText(/Opponent B/)).toBeTruthy();
  });
});
