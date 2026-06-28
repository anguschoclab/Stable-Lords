// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RivalryCard } from '@/components/dashboard/RivalryCard';
import type { DerivedRivalry } from '@/types/rivalry.types';

function makeRivalry(overrides: Partial<DerivedRivalry> = {}): DerivedRivalry {
  return {
    stableName: 'Iron Wolves',
    ownerId: 'owner-1',
    intensity: 3,
    kills: [],
    bouts: 10,
    playerWins: 6,
    playerLosses: 4,
    ...overrides,
  };
}

describe('RivalryCard H2H bar', () => {
  it('renders a win-rate bar when bouts > 0', () => {
    const { container } = render(
      <RivalryCard rivalry={makeRivalry()} rosterNames={new Set()} />
    );
    const bar = container.querySelector('[data-testid="h2h-bar"]');
    expect(bar).toBeInTheDocument();
  });

  it('player-wins segment width reflects playerWins/bouts ratio', () => {
    const { container } = render(
      <RivalryCard rivalry={makeRivalry({ bouts: 10, playerWins: 6, playerLosses: 3 })} rosterNames={new Set()} />
    );
    const playerSeg = container.querySelector('[data-testid="h2h-player"]') as HTMLElement;
    expect(playerSeg).toBeInTheDocument();
    expect(playerSeg.style.width).toBe('60%');
  });

  it('draws segment appears when bouts > playerWins + playerLosses', () => {
    const { container } = render(
      <RivalryCard rivalry={makeRivalry({ bouts: 10, playerWins: 6, playerLosses: 3 })} rosterNames={new Set()} />
    );
    const drawSeg = container.querySelector('[data-testid="h2h-draw"]') as HTMLElement;
    expect(drawSeg).toBeInTheDocument();
    expect(drawSeg.style.width).toBe('10%');
  });

  it('rival segment width reflects playerLosses/bouts ratio', () => {
    const { container } = render(
      <RivalryCard rivalry={makeRivalry({ bouts: 10, playerWins: 6, playerLosses: 3 })} rosterNames={new Set()} />
    );
    const rivalSeg = container.querySelector('[data-testid="h2h-rival"]') as HTMLElement;
    expect(rivalSeg).toBeInTheDocument();
    expect(rivalSeg.style.width).toBe('30%');
  });

  it('renders no h2h bar when bouts === 0', () => {
    const { container } = render(
      <RivalryCard rivalry={makeRivalry({ bouts: 0, playerWins: 0, playerLosses: 0 })} rosterNames={new Set()} />
    );
    const bar = container.querySelector('[data-testid="h2h-bar"]');
    expect(bar).not.toBeInTheDocument();
  });

  it('renders bout record text', () => {
    render(<RivalryCard rivalry={makeRivalry({ playerWins: 6, playerLosses: 4 })} rosterNames={new Set()} />);
    expect(screen.getByText(/6W/)).toBeInTheDocument();
    expect(screen.getByText(/4L/)).toBeInTheDocument();
  });
});
