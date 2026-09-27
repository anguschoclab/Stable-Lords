/**
 * Stage G — roster crown chips.
 * A player warrior ranked on a title ladder gets an honest "Contender #N"
 * chip on the roster wall; a reigning champion's crown stays the stronger
 * signal. The rank comes from the same contender index the AI campaigns
 * against — nothing fabricated.
 */
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RosterWarriorRow } from '@/components/stable/RosterWarriorRow';
import type { FightingStyle } from '@/types/shared.types';
import '@/test/_setup/setup';

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseWarrior = {
  id: 'w1',
  name: 'Aulus',
  fame: 120,
  style: 'Striking Attack' as FightingStyle,
  champion: false,
  attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
  career: { wins: 8, losses: 2, kills: 0 },
  injuries: [],
};

describe('RosterWarriorRow — crown chip', () => {
  it('shows a contender chip with real rank and arena name when provided', () => {
    render(
      <RosterWarriorRow
        warrior={baseWarrior}
        rankIndex={0}
        onClick={vi.fn()}
        contenderBadge={{ arenaName: 'The Brass Ring', rank: 2 }}
      />
    );
    expect(screen.getByText(/contender #2/i)).toBeInTheDocument();
    expect(screen.getByText(/the brass ring/i)).toBeInTheDocument();
  });

  it('renders no contender chip when the warrior is off every ladder', () => {
    render(<RosterWarriorRow warrior={baseWarrior} rankIndex={0} onClick={vi.fn()} />);
    expect(screen.queryByText(/contender/i)).not.toBeInTheDocument();
  });

  it('prefers the reigning crown over a contender chip', () => {
    render(
      <RosterWarriorRow
        warrior={{ ...baseWarrior, champion: true }}
        rankIndex={0}
        onClick={vi.fn()}
        contenderBadge={{ arenaName: 'The Brass Ring', rank: 1 }}
      />
    );
    expect(screen.queryByText(/contender/i)).not.toBeInTheDocument();
  });
});
