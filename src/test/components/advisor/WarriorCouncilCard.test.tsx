// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WarriorCouncilCard } from '@/pages/Advisor/components/WarriorCouncilCard';
import { FightingStyle } from '@/types/shared.types';
import type { WarriorAdvisorCard } from '@/engine/advisor/types';
import '@/test/_setup/setup';

const mockCard: WarriorAdvisorCard = {
  warriorId: 'w1' as any,
  warriorName: 'Aulus',
  style: FightingStyle.AimedBlow,
  campaignFocus: 'PURSE_HUNTER',
  suggestedCampaignFocus: 'PURSE_HUNTER',
  fatigueStatus: { band: 'fresh', value: 10 },
  injuryStatus: { isInjured: false, severities: [], requiresRecovery: false },
  fightAdvice: {
    action: 'ACCEPT_OFFER',
    recommendedOfferId: 'off_1' as any,
    recommendedOffer: { id: 'off_1', purse: 220 } as any,
    matchupEdge: 2,
    headline: 'Favorable Bout vs Cassius (+220G)',
    reasoning: ['Hard style counter (+2 advantage)'],
    warnings: [],
    dangerLevel: 'SAFE',
  },
  tournamentAdvice: {
    qualifiedTier: 'Gold',
    tierName: 'Imperial Gold Cup',
    overallRank: 32,
    isParticipant: false,
    weeksUntilTournament: 5,
    status: 'QUALIFYING',
    headline: 'Contending for Imperial Gold Cup (Rank #32)',
    details: '5 weeks remaining in season campaign.',
  },
  trainingAdvice: {
    mode: 'attribute',
    targetAttribute: 'DF',
    gainChance: 0.45,
    headline: 'Train Deftness (45% gain chance)',
    reasoning: 'Deftness synergizes with Aimed Blow.',
  },
  tacticsAdvice: {
    bestOffensiveTactic: 'Decisiveness',
    bestDefensiveTactic: 'Riposte',
    suggestedOE: 6,
    suggestedAL: 6,
    gearNotes: ['Optimal synergy: Decisiveness + Riposte'],
  },
  headlineSummary: 'Favorable Bout vs Cassius (+220G) · Train Deftness',
  actionPayload: {
    warriorId: 'w1' as any,
    trainingAssignment: { warriorId: 'w1' as any, type: 'attribute', attribute: 'DF' },
    boutOfferIdToAccept: 'off_1' as any,
  },
};

describe('WarriorCouncilCard', () => {
  it('renders warrior name, style, rank, and headline summary', () => {
    render(
      <WarriorCouncilCard
        card={mockCard}
        onApplyPlan={vi.fn()}
        onSetFocus={vi.fn()}
      />
    );

    expect(screen.getByText('Aulus')).toBeDefined();
    expect(screen.getByText('AB')).toBeDefined();
    expect(screen.getAllByText(/32/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Favorable Bout vs Cassius/i).length).toBeGreaterThan(0);
  });

  it('renders combat, training, and tactics panels', () => {
    render(
      <WarriorCouncilCard
        card={mockCard}
        onApplyPlan={vi.fn()}
        onSetFocus={vi.fn()}
      />
    );

    expect(screen.getAllByText(/Train Deftness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Decisiveness/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Riposte/i).length).toBeGreaterThan(0);
  });

  it('fires onApplyPlan when Apply Plan button is clicked', () => {
    const handleApply = vi.fn();
    render(
      <WarriorCouncilCard
        card={mockCard}
        onApplyPlan={handleApply}
        onSetFocus={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: /Apply Plan for Aulus/i });
    fireEvent.click(button);
    expect(handleApply).toHaveBeenCalledWith('w1');
  });

  it('shows a suggested-focus caption only when the pin diverges from auto-detection', () => {
    const diverged: WarriorAdvisorCard = {
      ...mockCard,
      campaignFocus: 'REHABILITATION',
      suggestedCampaignFocus: 'PURSE_HUNTER',
    };

    const { unmount } = render(
      <WarriorCouncilCard card={diverged} onApplyPlan={vi.fn()} onSetFocus={vi.fn()} />
    );
    expect(screen.getByText(/Suggested:/i)).toBeInTheDocument();
    unmount();

    render(
      <WarriorCouncilCard card={mockCard} onApplyPlan={vi.fn()} onSetFocus={vi.fn()} />
    );
    expect(screen.queryByText(/Suggested:/i)).not.toBeInTheDocument();
  });
});
