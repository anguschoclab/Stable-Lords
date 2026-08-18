// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Warrior } from '@/types/warrior.types';
import type { FightingStyle, WarriorId } from '@/types/shared.types';

const mockToggleChallenge = vi.fn();
const mockToggleAvoid = vi.fn();
let mockPlayerChallenges: string[] = [];
let mockPlayerAvoids: string[] = [];

vi.mock('@/state/useGameStore', () => ({
  useGameStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      playerChallenges: mockPlayerChallenges,
      playerAvoids: mockPlayerAvoids,
      toggleChallenge: mockToggleChallenge,
      toggleAvoid: mockToggleAvoid,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/components/charts/FormSparkline', () => ({
  FormSparkline: () => <div data-testid="form-sparkline" />,
}));

vi.mock('@/components/bookmarks/BookmarkButton', () => ({
  BookmarkButton: () => <div data-testid="bookmark-button" />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/WarriorBadges', () => ({
  StatBadge: () => <div data-testid="stat-badge" />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button data-testid="button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
}));

import { WarriorDossierHeader } from '@/components/warrior/dossier/WarriorDossierHeader';

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

describe('WarriorDossierHeader', () => {
  beforeEach(() => {
    mockToggleChallenge.mockClear();
    mockToggleAvoid.mockClear();
    mockPlayerChallenges = [];
    mockPlayerAvoids = [];
  });

  it('does NOT render Challenge/Avoid buttons for player-owned warriors', () => {
    const warrior = makeWarrior();
    render(<WarriorDossierHeader warrior={warrior} record="5W - 3L - 1K" isPlayerOwned={true} />);
    expect(screen.queryByText('Challenge')).not.toBeInTheDocument();
    expect(screen.queryByText('Avoid')).not.toBeInTheDocument();
  });

  it('renders Challenge and Avoid buttons for rival warriors', () => {
    const warrior = makeWarrior();
    render(<WarriorDossierHeader warrior={warrior} record="5W - 3L - 1K" isPlayerOwned={false} />);
    expect(screen.getByText('Challenge')).toBeInTheDocument();
    expect(screen.getByText('Avoid')).toBeInTheDocument();
  });

  it('calls toggleChallenge with warrior.id when Challenge button clicked', () => {
    const warrior = makeWarrior({ id: 'rival1' as WarriorId });
    render(<WarriorDossierHeader warrior={warrior} record="5W - 3L - 1K" isPlayerOwned={false} />);
    fireEvent.click(screen.getByText('Challenge'));
    expect(mockToggleChallenge).toHaveBeenCalledWith('rival1');
  });

  it('calls toggleAvoid with warrior.id when Avoid button clicked', () => {
    const warrior = makeWarrior({ id: 'rival1' as WarriorId });
    render(<WarriorDossierHeader warrior={warrior} record="5W - 3L - 1K" isPlayerOwned={false} />);
    fireEvent.click(screen.getByText('Avoid'));
    expect(mockToggleAvoid).toHaveBeenCalledWith('rival1');
  });

  it('shows Challenged text when warrior is already challenged', () => {
    mockPlayerChallenges = ['rival1'];
    const warrior = makeWarrior({ id: 'rival1' as WarriorId });
    render(<WarriorDossierHeader warrior={warrior} record="5W - 3L - 1K" isPlayerOwned={false} />);
    expect(screen.getByText('Challenged')).toBeInTheDocument();
  });

  it('shows Avoided text when warrior is already avoided', () => {
    mockPlayerAvoids = ['rival1'];
    const warrior = makeWarrior({ id: 'rival1' as WarriorId });
    render(<WarriorDossierHeader warrior={warrior} record="5W - 3L - 1K" isPlayerOwned={false} />);
    expect(screen.getByText('Avoided')).toBeInTheDocument();
  });
});
