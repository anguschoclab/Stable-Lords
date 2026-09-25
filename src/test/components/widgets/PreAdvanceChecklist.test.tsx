// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PreAdvanceChecklist } from '@/components/widgets/PreAdvanceChecklist';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState, BoutOffer } from '@/types/state.types';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const baseAttrs = { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 };

function seed(over: Partial<GameState> = {}) {
  const fresh = createFreshState('test-seed');
  const w1 = makeWarrior('w1' as any, 'Aulus', FightingStyle.AimedBlow, baseAttrs);
  const rival = makeWarrior('r1' as any, 'Brutus', FightingStyle.WallOfSteel, baseAttrs);
  fresh.roster = [w1];
  fresh.rivals = [{ id: 'rs', roster: [rival], owner: { stableName: 'Rivals' } } as any];
  fresh.week = 5;
  fresh.absoluteWeek = 5;
  fresh.year = 1;
  fresh.season = 'Spring';
  fresh.weather = 'Clear';
  fresh.realmRankings = {};
  fresh.boutOffers = {};
  fresh.trainingAssignments = [];
  fresh.treasury = 500;
  Object.assign(fresh, over);
  useGameStore.getState().loadGame('test-slot', fresh as GameState);
  return { w1, rival };
}

describe('PreAdvanceChecklist', () => {
  beforeEach(() => seed());

  it('renders "all resolved" when no council directives are outstanding', () => {
    // A dev prospect with no offers still gets a training recommendation →
    // that IS unresolved. Give them the assignment so the board is clean.
    seed({
      trainingAssignments: [
        { warriorId: 'w1' as any, type: 'attribute', attribute: 'DF' },
      ],
    });
    render(<PreAdvanceChecklist />);
    expect(screen.getByText(/resolved|clear/i)).toBeDefined();
  });

  it('lists unresolved directives — unsigned offer and stale tactics plan', () => {
    const { rival } = seed();
    const offer: BoutOffer = {
      id: 'off_1' as any,
      promoterId: 'p1' as any,
      warriorIds: ['w1' as any, rival.id],
      boutWeek: 6,
      createdAbsoluteWeek: 5,
      expirationWeek: 6,
      purse: 220,
      hype: 10,
      status: 'Proposed',
      responses: { w1: 'Pending', [rival.id]: 'Accepted' } as any,
    };
    useGameStore.getState().setState((draft: any) => {
      draft.boutOffers = { off_1: offer };
    });

    render(<PreAdvanceChecklist />);
    // w1's bout is recommended but unsigned; a fighting warrior whose plan
    // diverges from the council patch is flagged for tactics too.
    expect(screen.getByText(/Sign bout contract/i)).toBeDefined();
    expect(screen.getByText(/Apply recommended tactics plan/i)).toBeDefined();
  });
});
