import { describe, it, expect } from 'vitest';
import { resolveImpacts } from '@/engine/impacts';
import type { StateImpact } from '@/engine/impacts';
import type { GameState } from '@/types/state.types';
import type { StableId } from '@/types/shared.types';

function makeState(lastSimReport?: any): GameState {
  return {
    treasury: 1000,
    fame: 50,
    week: 1,
    season: 'Spring',
    weather: 'Clear',
    day: 0,
    year: 1,
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
    lastSimulationReport: lastSimReport,
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

describe('NF1: lastSimulationReport leakage', () => {
  it('lastSimulationReport is replaced (not merged) by impact system', () => {
    const oldReport = {
      id: 'old-report' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 100,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Old Fight', winner: 'A', by: 'KO' } as any],
    };

    const state = makeState(oldReport);

    // Apply a new lastSimulationReport impact
    const newReport = {
      id: 'new-report' as any,
      week: 2,
      absoluteWeek: 2,
      treasuryChange: 200,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'New Fight', winner: 'D', by: 'Kill' } as any],
    };

    const impact: StateImpact = {
      lastSimulationReport: newReport as any,
    };

    resolveImpacts(state, [impact]);

    // The new report should completely replace the old one
    expect(state.lastSimulationReport).toBe(newReport);
    expect(state.lastSimulationReport?.week).toBe(2);
    expect(state.lastSimulationReport?.bouts?.length).toBe(1);
    expect(state.lastSimulationReport?.bouts?.[0]?.title).toBe('New Fight');
  });

  it('lastSimulationReport does not accumulate bouts across weeks', () => {
    const week1Report = {
      id: 'week1' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Week 1 Fight' } as any],
    };

    const state = makeState(week1Report);

    // Simulate week 2's report
    const week2Report = {
      id: 'week2' as any,
      week: 2,
      absoluteWeek: 2,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [{ title: 'Week 2 Fight' } as any],
    };

    resolveImpacts(state, [{ lastSimulationReport: week2Report } as any]);

    // Should only have week 2's bouts, not accumulated
    expect(state.lastSimulationReport?.bouts?.length).toBe(1);
    expect(state.lastSimulationReport?.bouts?.[0]?.title).toBe('Week 2 Fight');
  });

  it('lastSimulationReport with undefined impact does not clear existing report', () => {
    const existingReport = {
      id: 'existing' as any,
      week: 1,
      absoluteWeek: 1,
      treasuryChange: 0,
      trainingGains: [],
      agingEvents: [],
      healthEvents: [],
      bouts: [],
    };

    const state = makeState(existingReport);

    // Apply an impact that does NOT include lastSimulationReport
    resolveImpacts(state, [{ treasuryDelta: 100 }]);

    // The existing report should still be there
    expect(state.lastSimulationReport).toBe(existingReport);
  });
});
