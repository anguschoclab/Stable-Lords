import { describe, it, expect, vi } from 'vitest';

vi.mock('@/engine/bout/services/boutProcessorService', () => {
  const mockBoutResult = {
    a: { id: 'w1', name: 'Alice', style: 'Striking Attack', fame: 100 },
    d: { id: 'w2', name: 'Bob', style: 'Total Parry', fame: 50 },
    outcome: { winner: 'A', by: 'KO', minutes: 3, log: [{ text: 'Alice wins!' }] },
    isRivalry: false,
    contractId: 'test-contract',
  };
  return {
    processWeekBouts: vi.fn(() => ({
      impact: {},
      results: [mockBoutResult],
      summary: {
        bouts: 1,
        deaths: 0,
        injuries: 0,
        deathNames: [],
        injuryNames: [],
        hadPlayerDeath: false,
        hadRivalryEscalation: false,
      },
    })),
  };
});

import '@/test/_setup/setup';
import { runBoutSimulationPass } from '@/engine/pipeline/passes/BoutSimulationPass';
import { SeededRNGService } from '@/utils/random';
import type { GameState } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';

function makeState(week: number, year: number): GameState {
  return {
    treasury: 1000,
    fame: 50,
    week,
    year,
    absoluteWeek: (year - 1) * 52 + week,
    season: 'Spring',
    weather: 'Clear',
    day: 0,
    roster: [],
    rivals: [],
    newsletter: [],
    ledger: [],
    arenaHistory: [],
    graveyard: [],
    retired: [],
    hallOfFame: [],
    matchHistory: [],
    moodHistory: [],
    scoutReports: [],
    insightTokens: [],
    playerChallenges: [],
    playerAvoids: [],
    coachDismissed: [],
    restStates: [],
    unacknowledgedDeaths: [],
    awards: [],
    seasonalGrowth: [],
    recruitPool: [],
    tournaments: [],
    realmRankings: {},
    boutOffers: {},
    promoters: {},
    trainers: [],
    hiringPool: [],
    gazettes: [],
    ownerGrudges: [],
    rivalries: [],
    trainingAssignments: [],
    isTournamentWeek: false,
    activeTournamentId: undefined,
    crowdMood: 'Calm',
    lastSimulationReport: undefined,
    player: {
      id: 'stable-player' as StableId,
      name: 'You',
      stableName: "Dragon's Hearth",
      fame: 0,
      renown: 0,
      titles: 0,
    },
    meta: { gameName: 'Stable Lords', version: '1.0', createdAt: '' },
  } as any;
}

describe('NF7: BoutSimulationPass hardcoded 2024 timestamp', () => {
  const rng = new SeededRNGService(42);

  it('createdAt for game year 2, week 1 should be Jan 1, 2025 (not Jan 7)', () => {
    // Bug: Date.UTC(2024, 0, 1 + 53*7) = Jan 7, 2025 (absoluteWeek drift)
    // Fix: Date.UTC(2024 + 2 - 1, 0, 1 + 0*7) = Jan 1, 2025
    const state = makeState(1, 2);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    expect(report).toBeDefined();
    expect(report.bouts).toHaveLength(1);

    const createdAt = report.bouts[0].createdAt as string;
    const date = new Date(createdAt);

    // After fix: should be Jan 1, 2025 (start of game year 2)
    // With bug: is Jan 7, 2025 (53 * 7 = 371 days from Jan 1, 2024)
    expect(date.getUTCFullYear(), 'year should be 2025').toBe(2025);
    expect(date.getUTCMonth(), 'month should be January (0)').toBe(0);
    expect(date.getUTCDate(), 'day should be 1, not 7 (absoluteWeek drift bug)').toBe(1);
  });

  it('createdAt for game year 1, week 1 should be Jan 1, 2024', () => {
    const state = makeState(1, 1);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    const createdAt = report.bouts[0].createdAt as string;
    const date = new Date(createdAt);

    // Game year 1, week 1 should be Jan 1, 2024
    // With bug: Date.UTC(2024, 0, 1 + 1*7) = Jan 8, 2024 (off by 7 days)
    expect(date.getUTCFullYear(), 'year should be 2024').toBe(2024);
    expect(date.getUTCMonth(), 'month should be January (0)').toBe(0);
    expect(date.getUTCDate(), 'day should be 1, not 8 (off-by-one week bug)').toBe(1);
  });
});
