// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { seedAdvisorScenario } from '@/test/_fixtures/advisorSeed';
import { render, screen } from '@testing-library/react';
import { PreAdvanceChecklist } from '@/components/widgets/PreAdvanceChecklist';
import { useGameStore } from '@/state/useGameStore';
import type { BoutOffer } from '@/types/state.types';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const seed = seedAdvisorScenario;

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
