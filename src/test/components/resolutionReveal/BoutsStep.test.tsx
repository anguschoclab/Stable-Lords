// @vitest-environment jsdom
/**
 * A4 — BoutsStep renders the salvaged run-round result components:
 * a casualty summary (RunResultsSummary) and collapsible BoutRow entries
 * whose BoutViewer only mounts once expanded.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BoutsStep } from '@/components/resolution-reveal/BoutsStep';
import type { BoutResult } from '@/engine/bout';
import type { Warrior } from '@/types/warrior.types';
import { FightingStyle } from '@/types/shared.types';

vi.mock('@/components/BoutViewer', () => ({
  default: () => <div data-testid="bout-viewer">BoutViewer</div>,
}));

vi.mock('@/engine/narrative/fightAnalysis', () => ({
  buildFightAnalysis: () => ({ summary: 'test' }),
}));

function makeWarrior(id: string, name: string): Warrior {
  return {
    id: id as Warrior['id'],
    name,
    style: FightingStyle.StrikingAttack,
    attributes: { ST: 10, CN: 10, SZ: 10, WT: 10, WL: 10, SP: 10, DF: 10 },
    career: { wins: 1, losses: 0, kills: 0 },
    status: 'Active',
    injuries: [],
    fame: 10,
    popularity: 0,
    titles: [],
    flair: [],
    champion: false,
    traits: [],
  } as Warrior;
}

function makeResult(by: 'Kill' | 'KO' | 'Decision', a: string, d: string): BoutResult {
  return {
    a: makeWarrior(`id_${a}`, a),
    d: makeWarrior(`id_${d}`, d),
    outcome: { winner: 'A', by, log: [], exchangeLog: [], minutes: 3 } as BoutResult['outcome'],
    isRivalry: false,
  };
}

describe('BoutsStep (A4 run-round salvage)', () => {
  it('renders the casualty summary from real bout outcomes', () => {
    render(
      <BoutsStep
        bouts={[makeResult('Kill', 'Alpha', 'Bravo'), makeResult('KO', 'Charlie', 'Delta')]}
      />
    );
    expect(screen.getByText(/1 Casualties/)).toBeInTheDocument();
    expect(screen.getByText(/1 KOs/)).toBeInTheDocument();
  });

  it('renders collapsible bout rows; viewer mounts on expand', () => {
    render(<BoutsStep bouts={[makeResult('Decision', 'Alpha', 'Bravo')]} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Bravo')).toBeInTheDocument();
    expect(screen.queryByTestId('bout-viewer')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Alpha'));
    expect(screen.getByTestId('bout-viewer')).toBeInTheDocument();
  });
});
