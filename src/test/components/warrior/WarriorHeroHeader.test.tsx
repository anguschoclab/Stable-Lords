// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

vi.mock('@/components/ui/Surface', () => ({
  Surface: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/ImperialRing', () => ({
  ImperialRing: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ui/EditableText', () => ({
  EditableText: ({ value }: any) => <span>{value}</span>,
}));
vi.mock('@/components/ui/WarriorBadges', () => ({
  TagBadge: ({ tag }: any) => <span>{tag}</span>,
}));
vi.mock('@/components/charts/FormSparkline', () => ({
  FormSparkline: () => <div data-testid="sparkline" />,
}));
vi.mock('@/state/useGameStore', () => ({
  useGameStore: vi.fn(() => vi.fn()),
}));

import { WarriorHeroHeader } from '@/components/warrior/WarriorHeroHeader';

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
    fame: 7,
    popularity: 3,
    titles: [],
    flair: [],
    champion: false,
    status: 'Active',
    ...overrides,
  } as Warrior;
}

describe('WarriorHeroHeader', () => {
  const baseProps = {
    warrior: makeWarrior() as any,
    record: '5W - 3L - 1K',
    streakLabel: null,
    streakVal: 0,
  };

  it('renders "Your Gladiator" for isPlayerOwned warrior', () => {
    render(<WarriorHeroHeader {...baseProps} isPlayerOwned={true} />);
    expect(screen.getByText('Your Gladiator')).toBeInTheDocument();
  });

  it('renders "Rival Gladiator" for non-owned warrior', () => {
    render(<WarriorHeroHeader {...baseProps} isPlayerOwned={false} />);
    expect(screen.getByText('Rival Gladiator')).toBeInTheDocument();
  });

  it('renders "Condition" ring label', () => {
    render(<WarriorHeroHeader {...baseProps} />);
    expect(screen.getByText('Condition')).toBeInTheDocument();
  });

  it('renders "Wounds" ring label', () => {
    render(<WarriorHeroHeader {...baseProps} />);
    expect(screen.getByText('Wounds')).toBeInTheDocument();
  });

  it('renders "Intel Acquired" when insightTokens are present for this warrior', () => {
    render(
      <WarriorHeroHeader
        {...baseProps}
        id="w1"
        insightTokens={[{ warriorId: 'w1' as WarriorId, type: 'weapon', revealed: true } as any]}
      />
    );
    expect(screen.getByText(/Intel Acquired/i)).toBeInTheDocument();
  });

  it('does not render "Intel Acquired" when no insight tokens', () => {
    render(<WarriorHeroHeader {...baseProps} id="w1" insightTokens={[]} />);
    expect(screen.queryByText(/Intel Acquired/i)).not.toBeInTheDocument();
  });
});
