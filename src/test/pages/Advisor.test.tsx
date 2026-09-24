// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import AdvisorPage from '@/pages/Advisor';
import { useGameStore } from '@/state/useGameStore';
import { createFreshState } from '@/engine/factories/gameStateFactory';
import { makeWarrior } from '@/engine/factories/warriorFactory';
import { FightingStyle } from '@/types/shared.types';
import type { GameState } from '@/types/state.types';
import '@/test/_setup/setup';

const baseAttrs = { ST: 14, CN: 14, SZ: 11, WT: 12, WL: 11, SP: 14, DF: 11 };

describe('AdvisorPage', () => {
  beforeEach(() => {
    const fresh = createFreshState('test-seed');
    const w1 = makeWarrior('w1' as any, 'Aulus', FightingStyle.AimedBlow, baseAttrs);
    const w2 = makeWarrior('w2' as any, 'Brutus', FightingStyle.BashingAttack, baseAttrs, {
      injuries: [
        {
          id: 'i1' as any,
          name: 'Fractured Bone',
          description: '',
          severity: 'Severe',
          weeksRemaining: 3,
          penalties: {},
        },
      ],
    });
    fresh.roster = [w1, w2];
    fresh.week = 5;
    fresh.absoluteWeek = 5;
    fresh.year = 1;
    fresh.season = 'Spring';
    fresh.weather = 'Clear';
    fresh.realmRankings = {
      w1: { overallRank: 20, classRank: 2, compositeScore: 210 },
      w2: { overallRank: 80, classRank: 8, compositeScore: 160 },
    } as any;
    fresh.boutOffers = {};
    fresh.trainingAssignments = [];
    useGameStore.getState().loadGame('test-slot', fresh as GameState);
  });

  it('renders War Council header, KPI directives, and roster cards', () => {
    render(<AdvisorPage />);

    expect(screen.getByText(/Lanista's War Council/i)).toBeDefined();
    expect(screen.getByText(/Execute War Council Plan/i)).toBeDefined();
    // Names also appear in the Campaign Horizon (contenders/recovery) — scope to the card grid
    const grid = within(screen.getByTestId('warrior-cards'));
    expect(grid.getByText('Aulus')).toBeDefined();
    expect(grid.getByText('Brutus')).toBeDefined();
  });

  it('renders a solvency warning chip when the treasury cannot cover projected costs', () => {
    const fresh = createFreshState('test-seed-broke');
    fresh.roster = [
      makeWarrior('w9' as any, 'Cassian', FightingStyle.AimedBlow, baseAttrs),
    ];
    fresh.week = 5;
    fresh.absoluteWeek = 5;
    fresh.season = 'Spring';
    fresh.weather = 'Clear';
    fresh.treasury = 5;
    fresh.realmRankings = {};
    fresh.boutOffers = {};
    fresh.trainingAssignments = [];
    useGameStore.getState().loadGame('test-slot', fresh as GameState);

    render(<AdvisorPage />);
    expect(screen.getByTestId('solvency-warning')).toBeInTheDocument();
  });

  it('filters roster by tabs (Rehab filter isolates injured warrior)', () => {
    render(<AdvisorPage />);

    // Click Med Bay filter
    const rehabTab = screen.getByRole('button', { name: /Med Bay/i });
    fireEvent.click(rehabTab);

    // Brutus is in rehab; Aulus is not — scope to the card grid since the
    // Campaign Horizon also lists contender/recovery names
    const grid = within(screen.getByTestId('warrior-cards'));
    expect(grid.queryByText('Aulus')).toBeNull();
    expect(grid.getByText('Brutus')).toBeDefined();
  });
});
