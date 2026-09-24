// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CouncilBriefingWidget } from '@/pages/ControlCenter/components/CouncilBriefingWidget';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const baseAttrs = { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 };

describe('CouncilBriefingWidget', () => {
  beforeEach(() => {
    const fresh = createFreshState('test-seed');
    const w1 = makeWarrior('w1' as any, 'Aulus', FightingStyle.AimedBlow, baseAttrs);
    fresh.roster = [w1];
    fresh.week = 5;
    fresh.absoluteWeek = 5;
    fresh.year = 1;
    fresh.season = 'Spring';
    fresh.weather = 'Clear';
    fresh.realmRankings = {};
    fresh.boutOffers = {};
    fresh.trainingAssignments = [];
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

  it('renders War Council briefing card with link to /stable/advisor', () => {
    render(<CouncilBriefingWidget />);

    expect(screen.getAllByText(/War Council/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Review War Council/i)).toBeDefined();
  });
});
