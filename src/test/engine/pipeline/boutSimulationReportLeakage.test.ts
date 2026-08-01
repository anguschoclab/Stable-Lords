import { describe, it, expect, vi } from 'vitest';

vi.mock('@/engine/bout/services/boutProcessorService', () => ({
  processWeekBouts: vi.fn(() => ({
    impact: {},
    results: [],
    summary: {
      bouts: 0,
      deaths: 0,
      injuries: 0,
      deathNames: [],
      injuryNames: [],
      hadPlayerDeath: false,
      hadRivalryEscalation: false,
    },
  })),
}));

import '@/test/_setup/setup';
import { runBoutSimulationPass } from '@/engine/pipeline/passes/BoutSimulationPass';
import { SeededRNGService } from '@/utils/random';
import type { GameState } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';

function makeState(week: number, year: number, prevReport?: any): GameState {
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
    lastSimulationReport: prevReport,
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

describe('NF1: BoutSimulationPass lastSimulationReport leakage', () => {
  const rng = new SeededRNGService(42);

  it('week 2 report should NOT contain week 1 trainingGains', () => {
    const week1Report = {
      id: 'week1-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 500,
      trainingGains: [{ warriorId: 'w1', gains: { ST: 1 } }] as any,
      agingEvents: [{ warriorId: 'w1', age: 26 }] as any,
      healthEvents: [{ warriorId: 'w1', event: 'injury' }] as any,
      bouts: [],
    };

    const state = makeState(2, 1, week1Report);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    expect(report).toBeDefined();
    // NF1 bug: ...state.lastSimulationReport spread overwrites these with old values
    expect(report.trainingGains, 'trainingGains should be empty for week 2').toEqual([]);
    expect(report.agingEvents, 'agingEvents should be empty for week 2').toEqual([]);
    expect(report.healthEvents, 'healthEvents should be empty for week 2').toEqual([]);
  });

  it('week 2 report should have week=2, not week=1 from previous report', () => {
    const week1Report = {
      id: 'week1-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 500,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [],
    };

    const state = makeState(2, 1, week1Report);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    expect(report.week, 'week should be 2, not 1 from old report').toBe(2);
    expect(report.absoluteWeek, 'absoluteWeek should be 2, not 1 from old report').toBe(2);
  });

  it('week 2 report should have treasuryChange=0, not leaked from week 1', () => {
    const week1Report = {
      id: 'week1-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 500,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [],
    };

    const state = makeState(2, 1, week1Report);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    expect(report.treasuryChange, 'treasuryChange should be 0 for week 2, not 500 from week 1').toBe(0);
  });

  it('week 2 report bouts should be empty (no eligible warriors)', () => {
    const week1Report = {
      id: 'week1-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Old Fight' } as any],
    };

    const state = makeState(2, 1, week1Report);
    const { impact } = runBoutSimulationPass(state, rng, true);

    const report = impact.lastSimulationReport as any;
    expect(report.bouts, 'bouts should be empty for week 2 (no warriors)').toEqual([]);
  });
});
