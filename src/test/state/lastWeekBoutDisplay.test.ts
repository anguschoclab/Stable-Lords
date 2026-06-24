import { describe, it, expect } from 'vitest';
import { GameStateSchema } from '@/schemas/gameStateSchema';
import { truncateState } from '@/engine/storage/truncation';
import type { GameState } from '@/types/state.types';

describe('lastWeekBoutDisplay integration', () => {
  it('GameStateSchema accepts lastWeekBoutDisplay', () => {
    const minimalState = {
      meta: { gameName: 'Test', version: '1.0', createdAt: '' },
      pendingResolutionData: undefined,
      lastWeekBoutDisplay: {
        results: [],
        deathNames: ['Warrior X'],
        injuryNames: ['Warrior Y'],
      },
      ftueComplete: true,
      coachDismissed: [],
      player: { id: 'p1', name: 'P', stableName: 'S', fame: 0, renown: 0, titles: 0 },
      fame: 0,
      popularity: 0,
      treasury: 100,
      ledger: [],
      week: 1,
      year: 1,
      phase: 'planning',
      season: 'Spring',
      weather: 'Clear',
      roster: [],
      graveyard: [],
      retired: [],
      arenaHistory: [],
      promoters: {},
      boutOffers: {},
      realmRankings: {},
      awards: [],
      newsletter: [],
      gazettes: [],
      scoutReports: [],
      hallOfFame: [],
      trainers: [],
      hiringPool: [],
      recruitPool: [],
      crowdMood: 'Calm',
      moodHistory: [],
      tournaments: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      rivalries: [],
      matchHistory: [],
      playerChallenges: [],
      playerAvoids: [],
      ownerGrudges: [],
      insightTokens: [],
      unacknowledgedDeaths: [],
      day: 0,
      isTournamentWeek: false,
      isFTUE: false,
      ftueStep: 0,
      bookmarks: [],
      rivals: [],
      rosterBonus: 0,
    };

    expect(() => GameStateSchema.parse(minimalState)).not.toThrow();
  });

  it('GameStateSchema accepts state without lastWeekBoutDisplay (optional)', () => {
    const minimalState: Record<string, unknown> = {
      meta: { gameName: 'Test', version: '1.0', createdAt: '' },
      ftueComplete: true,
      coachDismissed: [],
      player: { id: 'p1', name: 'P', stableName: 'S', fame: 0, renown: 0, titles: 0 },
      fame: 0,
      popularity: 0,
      treasury: 100,
      ledger: [],
      week: 1,
      year: 1,
      phase: 'planning',
      season: 'Spring',
      weather: 'Clear',
      roster: [],
      graveyard: [],
      retired: [],
      arenaHistory: [],
      promoters: {},
      boutOffers: {},
      realmRankings: {},
      awards: [],
      newsletter: [],
      gazettes: [],
      scoutReports: [],
      hallOfFame: [],
      trainers: [],
      hiringPool: [],
      recruitPool: [],
      crowdMood: 'Calm',
      moodHistory: [],
      tournaments: [],
      trainingAssignments: [],
      seasonalGrowth: [],
      restStates: [],
      rivalries: [],
      matchHistory: [],
      playerChallenges: [],
      playerAvoids: [],
      ownerGrudges: [],
      insightTokens: [],
      unacknowledgedDeaths: [],
      day: 0,
      isTournamentWeek: false,
      isFTUE: false,
      ftueStep: 0,
      bookmarks: [],
      rivals: [],
      rosterBonus: 0,
    };

    expect(() => GameStateSchema.parse(minimalState)).not.toThrow();
  });

  it('truncateState strips lastWeekBoutDisplay', () => {
    const state = {
      meta: { gameName: 'Test', version: '1.0', createdAt: '' },
      lastWeekBoutDisplay: {
        results: [{ a: { id: 'w1' }, d: { id: 'w2' }, outcome: {} }] as any,
        deathNames: ['X'],
        injuryNames: ['Y'],
      },
    } as unknown as GameState;

    const truncated = truncateState(state);
    expect(truncated.lastWeekBoutDisplay).toBeUndefined();
  });
});
