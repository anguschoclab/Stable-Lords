// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CampaignHorizon } from '@/pages/Advisor/components/CampaignHorizon';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState, BoutOffer } from '@/types/state.types';
import '@/test/_setup/setup';

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

describe('CampaignHorizon', () => {
  beforeEach(() => seed());

  it('renders the tournament countdown', () => {
    render(<CampaignHorizon />);
    // Week 5 of 13 → 8 weeks until bracket
    expect(screen.getByText(/8 weeks until the seasonal tournament/i)).toBeDefined();
  });

  it('lists future signed commitments and recovery ETAs', () => {
    const { w1, rival } = seed();
    const offer: BoutOffer = {
      id: 'off_future' as any,
      promoterId: 'p1' as any,
      warriorIds: [w1.id, rival.id],
      boutWeek: 8,
      createdAbsoluteWeek: 5,
      expirationWeek: 8,
      purse: 300,
      hype: 10,
      status: 'Signed',
      responses: { [w1.id]: 'Accepted', [rival.id]: 'Accepted' } as any,
    };
    useGameStore.getState().setState((draft: any) => {
      draft.boutOffers = { off_future: offer };
      draft.roster[0].injuries = [
        {
          id: 'i1',
          name: 'Fracture',
          description: '',
          severity: 'Severe',
          weeksRemaining: 3,
          penalties: {},
        },
      ];
    });

    render(<CampaignHorizon />);
    expect(screen.getByText(/Brutus/)).toBeDefined();
    expect(screen.getByText(/300/)).toBeDefined();
    // Both the commitment (WK 8) and the recovery ETA (returns WK 8) render
    expect(screen.getAllByText(/WK 8/i).length).toBeGreaterThanOrEqual(2);
  });
});
