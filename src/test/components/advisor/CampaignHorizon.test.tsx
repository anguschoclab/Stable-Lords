// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { seedAdvisorScenario } from '@/test/_fixtures/advisorSeed';
import { render, screen } from '@testing-library/react';
import { CampaignHorizon } from '@/pages/Advisor/components/CampaignHorizon';
import { useGameStore } from '@/state/useGameStore';
import type { BoutOffer } from '@/types/state.types';
import '@/test/_setup/setup';

const seed = seedAdvisorScenario;

describe('CampaignHorizon', () => {
  beforeEach(() => seed());

  it('renders the tournament countdown', () => {
    render(<CampaignHorizon />);
    // Week 5 → next seasonal is week 10, so 5 weeks out
    expect(screen.getByText(/5 weeks until the seasonal tournament/i)).toBeDefined();
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
